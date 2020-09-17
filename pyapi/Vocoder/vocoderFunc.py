# -*- coding: utf-8 -*-
"""
Created on Mon Apr 22 11:29:54 2019

@author: beimx004
"""
import time
import numpy as np
import scipy as sp
import scipy.io as sio
import scipy.io.wavfile
import scipy.interpolate
import h5py
from .vocoderTools import ElFieldToActivity,ActivityToPower, NeurToBinMatrix, generate_cfs


def vocoderFunc(electrodogram,**kwargs):

    audioFs = kwargs.get('audioFs',48000)
    saveOutput = kwargs.get('saveOutput',False)
    outputFile = kwargs.get('outputFile',None)
    
    captFs = 55556
    nCarriers = 20   
    elecFreqs = None
    spread = None
    neuralLocsOct = None
    nNeuralLocs = 300
    MCLmuA = 500
    TmuA = 50
    tAvg = 0.005
    tauEnvMS = 10
    nl = 5
    resistorValue = 10


#%% Process electrodogram before proceeding to vocoder pipeline
    if type(electrodogram) is str:         
        if electrodogram[-3:] == '.h5':
            with h5py.File(electrodogram,'r') as f:
                if len(list(f.keys())) == 1:
                    electrodogram = np.array(f.get(list(f.keys())[0]))
                    if 16 in electrodogram.shape and len(electrodogram.shape) == 2:
                        if electrodogram.shape[0] == 16:
                            pass
                        else:
                            electrodogram = electrodogram.T
                    else:
                        raise ValueError('Electrodogram must be shape 16xn, (16 electrodes x n total samples)')
                else:
                    raise ValueError('HDF5 File contains multiple datasets. File should contain only the electrode pulse matrix.')
                f.close()
        elif electrodogram[-4:] == '.mat':
            rawData = sio.loadmat(electrodogram)
            if 'elData' in rawData.keys():                 
                electrodogram = rawData['elData']            
                if type(electrodogram) is sp.sparse.csc.csc_matrix:
                    electrodogram = electrodogram.A
                    if 16 in electrodogram.shape and len(electrodogram.shape) == 2:
                            if electrodogram.shape[0] == 16:
                                pass
                            else:
                                electrodogram = electrodogram.T
                    else:
                        raise ValueError('Electrodogram must be shape 16xn, (16 electrodes x n total samples)')
            else:
                raise KeyError('The supplied .mat file must contain data saved as "elData"')
            
            
        elif electrodogram[-4:] == '.npy':
            rawData = np.load(electrodogram);
            electrodogram = rawData
            if 16 in electrodogram.shape and len(electrodogram.shape) == 2:
                if electrodogram.shape[0] == 16:
                    pass
                else:
                    electrodogram = electrodogram.T
            else:
                raise ValueError('Electrodogram must be shape 16xn, (16 electrodes x n total samples)')
            
        elif electrodogram[-4:] == '.npz':
            rawData = sp.sparse.load_npz(electrodogram)
            electrodogram = rawData.A  
            if 16 in electrodogram.shape and len(electrodogram.shape) == 2:
                if electrodogram.shape[0] == 16:
                    pass
                else:
                    electrodogram = electrodogram.T
            else:
                raise ValueError('Electrodogram must be shape 16xn, (16 electrodes x n total samples)')
            
            
        else:
            raise ValueError('Invalid File format: Only .npy, scipy sparse .npz, .h5, or .mat files are allowed')
    elif type(electrodogram) is np.ndarray: 
        if 16 in electrodogram.shape:
            if electrodogram.shape[0] == 16:
                pass
            else:
                electrodogram = electrodogram.T
        else:
            raise ValueError('Electrodogram must be shape 16xn, (16 electrodes x n total samples)')
    else:
        raise ValueError('Expected str or numpy ndarray inputs.')
            


#%% Scale and preprocess electrodogram data     
    scaletoMuA = 500/resistorValue
#    electrodeAmp = electrodogram[:,1:] # the first column in the matrix is actually channel similarity.
    electrodeAmp =electrodogram
    nElec = electrodeAmp.shape[0]
    elData = electrodeAmp*scaletoMuA
    captTs = 1/captFs
  
# compute electrode locations in terms of frequency 
    if elecFreqs is None:
        elecFreqs = np.logspace(np.log10(381.5),np.log10(5046.4),nElec)
    else:
        if nElec != elecFreqs.size:
            raise ValueError('# of electrode frequencies does not match recorded data!')
        else:
            elecFreqs = elecFreqs
# load electric field spread data
    if spread is None:
        elecPlacement = np.zeros(nElec).astype(int) # change to zeros to reflect python indexing
        spreadFile = 'MatlabSupportFiles/spread.mat'
        spread = sio.loadmat(spreadFile)
    else: # This seciont may need reindexing if the actual spread mat data is passed through, for now let use the spread.mat data
        elecPlacement = spread['elecPlacement']
        
# Create octave location of neural populations
    if neuralLocsOct is None:
        neuralLocsOct = np.append(
                np.log2(np.linspace(150,850,40)),
                np.linspace(np.log2(870),np.log2(8000),260)
                )
        
    neuralLocsOct = np.interp(
            np.linspace(1,neuralLocsOct.size,nNeuralLocs),
            np.arange(1,neuralLocsOct.size+1),
            neuralLocsOct)
    
# tauEnvMS to remove carrier synthesis effect
    taus = tauEnvMS/1000
    alpha = np.exp(-1/(taus*captFs))
    
# MCT and T levels in micro amp
    if MCLmuA is None:
        MCLmuA = 500*np.ones(nElec)*1.2
    else:
        if (type(MCLmuA) == int) or (type(MCLmuA)== float):
            MCLmuA = np.ones(nElec)*MCLmuA*1.2            
        elif (type(MCLmuA) == 'numpy.ndarray') and (MCLmuA.size == nElec):
            MCLmuA = MCLmuA * 1.2
        else:
            raise ValueError('Wrong number of M levels!')
            
    if TmuA is None:
        TmuA = 50*np.ones(nElec)
    else:
        if (type(TmuA) == int) or (type(TmuA)== float):
            TmuA = np.ones(nElec)*TmuA                   
        elif (type(TmuA) == 'numpy.ndarray') and (TmuA.size == nElec):
            TmuA = TmuA
        else:
            raise ValueError('Wrong Number of T levels!')
            
# Time constant for averaging neural activity to relate to frequency
    tAvg = np.ceil(tAvg/captTs)*captTs
    mAvg = np.round(tAvg/captTs)
    blkSize = mAvg.astype(int)  
            
# audio output frequency
    audioFs = np.ceil(tAvg*audioFs)/tAvg
    audioTs = 1/audioFs
    tWin = 2*tAvg
    nFFT = np.round(tWin/audioTs).astype(int)        
        
# create matrix to convert electrode charge to electric field
    charge2EF = np.zeros((nNeuralLocs,nElec))
    elecFreqOct = np.log2(elecFreqs)
    
    for iEl in np.arange(nElec):
        f = scipy.interpolate.interp1d(
                spread['fOct'][:,elecPlacement[iEl]]+elecFreqOct[iEl],
                spread['voltage'][:,elecPlacement[iEl]],
                fill_value = 'extrapolate')       
        steerVec = f(neuralLocsOct)
        steerVec[steerVec < 0] = 0
        charge2EF[:,iEl] = steerVec

# matrix to map neural activity to FFT bin frequencies
# here we call another function
    mNeurToBin = NeurToBinMatrix(neuralLocsOct,nFFT,audioFs)
   
# Define auxilliary variables    
    
    #    random phase
    phs = 2*np.pi*np.random.rand(np.floor(nFFT/2).astype(int))
    
    # preallocate audio power matrix
    audioPwr = np.zeros((nNeuralLocs,blkSize+1))
    
    # interpolate M and T levels to match neural locations
    M = np.interp(neuralLocsOct,elecFreqOct,MCLmuA)
    M[neuralLocsOct<elecFreqOct[0]] = MCLmuA[0]
    M[neuralLocsOct>elecFreqOct[nElec-1]] = MCLmuA[nElec-1]
    
    
    T = np.interp(neuralLocsOct,elecFreqOct,TmuA)
    T[neuralLocsOct<elecFreqOct[0]] = TmuA[0]
    T[neuralLocsOct>elecFreqOct[nElec-1]] = TmuA[nElec-1]
    
    normRamp = np.multiply(charge2EF.T,1/(M-T)).T
    normOffset = (T/(M-T)).reshape((T.size,1))

    elData [elData < 0 ] = 0
    nlExp = np.exp(nl)
# Generate output carrier tone complex
    nBlocks = (nFFT/2*(np.floor(elData.shape[1]/blkSize+1))).astype(int)-1
    tones = np.zeros((nBlocks,nCarriers))
    toneFreqs = generate_cfs(20,20000,nCarriers)
    t = np.arange(nBlocks)/audioFs 
    
    for toneNum in np.arange(nCarriers):
        tones[:,toneNum] = np.sin(2.*np.pi*toneFreqs[toneNum]*t+phs[toneNum])   # random phase
#        tones[:,toneNum] = np.sin(2.*np.pi*toneFreqs[toneNum]*t)               # sine phase
      
    interpSpect = np.zeros((nCarriers,np.floor(elData.shape[1]/blkSize).astype(int)),dtype=complex)
# electrode data cleaning
#    for iChan in np.arange(0,elData.shape[0]):
#        for iTime in np.arange(1,elData.shape[1]):
#            if elData[iChan,iTime-1] > 5 and elData[iChan,iTime] > 5:
#                elData[iChan,iTime-1] = max((elData[iChan,iTime-1],elData[iChan,iTime]))
#                elData[iChan,iTime] = 0
                
    fftFreqs = np.arange(1,np.floor(nFFT/2)+1)*audioFs/nFFT
#%% Loop through frames of electrode data, convert to electric field, calculate neural spectrum
    for blkNumber in np.arange(1,(np.floor(elData.shape[1]/blkSize).astype(int))+1):
        # charge to electric field
        timeIdx = np.arange((blkNumber-1)*blkSize+1,blkNumber*blkSize+1,dtype=int)-1
        efData = np.dot(normRamp,elData[:,timeIdx])              
        
        
        
        # Normalized EF to neural activity
        
        
#        efData = (efData-normOffset)
#        electricField = np.maximum(0,efData)
#        electricField = electricField / 0.4 * 0.5  
#        activity = np.maximum(0,np.minimum(np.exp(nl*electricField),nlExp)-1)/(nlExp-1)
        
        
        
        
        activity = ElFieldToActivity(efData,normOffset,nl,nlExp)  # JIT optimized
        
#        Neural activity to audio power       
        audioPwr = ActivityToPower(alpha,activity,audioPwr,blkSize)  # JIT optimized inner loop
                
        # Average energy
        energy = np.sum(audioPwr,axis = 1)/mAvg        
#        spect = np.multiply(np.dot(mNeurToBin,energy),np.exp(1j*phs))       # this is normally overlap-add synthesized, to match interpolation try changing timpoints of the main blk loop to match the overlap add times (-nFFT/2)
        
        # interpolate spectrum across frequency 
#        fMagInt = sp.interpolate.interp1d(fftFreqs,np.abs(spect),fill_value = 'extrapolate')
#        fPhaseInt = sp.interpolate.interp1d(fftFreqs,np.angle(spect),fill_value = 'extrapolate')
        
        fMagInt = scipy.interpolate.interp1d(fftFreqs,np.dot(mNeurToBin,energy),fill_value = 'extrapolate')
        
        #calculate tone 
        toneMags = fMagInt(toneFreqs)
#        tonePhases = fPhaseInt(toneFreqs)        
#        interpSpect[:,blkNumber-1] = np.multiply(toneMags,np.exp(1j*tonePhases))
        interpSpect[:,blkNumber-1] = toneMags
        
#%% interpolated spectral envelope tone scaling
    
    specVec = np.arange(blkNumber)*nFFT/2
    newTimeVec = np.arange(nBlocks-(nFFT/2-1))
#    interpSpect2 = np.zeros((len(toneFreqs),len(newTimeVec)),dtype=complex)
    modTones = np.zeros((len(toneFreqs),len(newTimeVec)))
    for freq in np.arange(len(toneFreqs)):  
#        fEnvMag = sp.interpolate.interp1d(specVec,np.abs(interpSpect[freq,:]),fill_value = 'extrapolate')
#        fEnvPhs = sp.interpolate.interp1d(specVec,np.angle(interpSpect[freq,:]),fill_value = 'extrapolate')       
#        tEnvMag = fEnvMag(newTimeVec)
#        tEnvPhs = fEnvPhs(newTimeVec)       
#        interpSpect2[freq,:] = tEnvMag*np.exp(1j*tEnvPhs)
#        modTones[freq,:] = tones[:-(nFFT/2-1).astype(int),freq]*np.abs(interpSpect2[freq,:])
        fEnvMag = scipy.interpolate.interp1d(specVec,interpSpect[freq,:],fill_value = 'extrapolate')
        tEnvMag = fEnvMag(newTimeVec)
        modTones[freq,:] = tones[:-(nFFT/2-1).astype(int),freq]*tEnvMag
        
       
    audioOut = np.sum(modTones,axis=0)
    audioOut = audioOut/np.sqrt(np.mean(np.square(audioOut)))*10**(-25/20)

    if saveOutput:
        if outputFile is None:
            timestr = time.strftime("%Y%m%d_%H%M%S") 
            outputFile = 'Output/VocoderOutput_'+timestr
        amplitude = np.iinfo(np.int16).max
        audioToSave = audioOut*amplitude
        scipy.io.wavfile.write(outputFile+'.wav',audioFs.astype(int),np.int16(audioToSave))            
        
           
    return(audioOut,audioFs.astype(int))
    

    