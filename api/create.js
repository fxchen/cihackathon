import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tableName,
    // 'Item' contains the attributes of the item to be created
    // - 'userId': user identities are federated through the
    //             Cognito Identity Pool, we will use the identity id
    //             as the user id of the authenticated user
    // - 'algorithmId': a unique uuid
    // - 'label': parsed from request body
    // - 'attachment': parsed from request body
    // - 'createdAt': current Unix timestamp
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      algorithmId: uuid.v1(),
      label: data.label,
      attachment: data.attachment,
      createdAt: Date.now(),
      vocoderStatus: "Submitted for processing"
    },
  };

  await dynamoDb.put(params);

  // Trigger Lambda function to process attachment file
  // https://www.sqlshack.com/calling-an-aws-lambda-function-from-another-lambda-function/

  return params.Item;
});
