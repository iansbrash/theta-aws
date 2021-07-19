var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async function(event, context, callback) {        
    console.log('Received event:', JSON.stringify(event, null, 2));

    
    const params = {
        TableName: 'changelog',
        KeyConditionExpression: '#version < :version',
        Limit: 10,
        ScanIndexForward: false,    // true = ascending, false = descending
        ExpressionAttributeNames:{
            "#version": "version"
            },
        ExpressionAttributeValues: {
            ":version": '1.0.0'//(new Date()).getTime()
        }
    }
    
    let result = await docClient.query(params).promise();
    
    if (result.Item !== undefined && result.Item !== null) {
        return {
            "isBase64Encoded": false,
            "statusCode": 200,
            "body": result.Item
        }
    }
    else {
        return {
            "isBase64Encoded": false,
            "statusCode": 400,
            "body": "Error"
        }
    }
}
   