var AWS = require("aws-sdk");
const jwt = require('jsonwebtoken');
const token = require('./sensitive.js')


AWS.config.update({
    region: "us-east-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const authenticateJWT = (jwt_token) => {

    console.log(`in authenticateJWT middleware, jwt_token: ${jwt_token}`);
    console.log(`token: ${token}`)

    if (jwt_token === null) throw "JWT is null"

    return jwt.verify(jwt_token, token, (err, res) => {
        
        console.log('res:')
        console.log(res)

        if (err) {
            throw "Invalid signature"
        }
        else if (res === undefined || res === null) {
            throw "Invalid signature"
        }
        else {
           return res;
        }
    })
}

// HEADERS:
//      discordId
//      validationToken
    //      we first somehow check if that person is in the discord
    //      then we add it to the DB if the person is in the discord
    //      perhaps we use some cryptographic token encoded with a public key to make sure its a valid request
exports.handler = async function(event, context, callback) {        
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;

    // Make sure request is valid
    if (!headers || !headers.discordId || !headers.token) {
        return {
            "isBase64Encoded": false,
            "statusCode": 400,
            // "headers": { "session": newSession },
            "body": "Invalid Request"
        }
    }

    // Make sure JWT signature is correct (and therefore came from our discord bot)
    let jwtResult
    try {
        jwtResult = authenticateJWT(headers.token)
        console.log(jwtResult)
    }
    catch (err) {
        return {
            "isBase64Encoded": false,
            "statusCode": 400,
            "body": "Malformed token"
        }
    }
    
    if (jwtResult.id !== headers.discordId) {
        return {
            "isBase64Encoded": false,
            "statusCode": 400,
            "body": "Don't even try."
        }
    }
    
    const params = {
        TableName: 'licenseKeys',
        FilterExpression: "#discordId = :discordId",
        ExpressionAttributeNames: {
            "#discordId": "discordId",
        },
        ExpressionAttributeValues: {
             ":discordId": headers.discordId
        }
    }
    
    let result = await docClient.scan(params).promise();
    
    console.log(result)
    
    // if we can go ahead and add a new beta tester
    if (result.Items.length === 0) {
        console.log('item is undefined!')
        
        
        // generate entirely new licenseKey and attach discordId to it
        let newLicense = "BETA-" + randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ').toUpperCase().match(/.{1,4}/g).join('-');
        console.log(newLicense)
        
        const putParams = {
            TableName: 'licenseKeys',
            Item:{
                "license": newLicense,
                "discordId": headers.discordId,
                "session": ""
            }
        }
        
        try {
            await docClient.put(putParams).promise();
            return {
                "isBase64Encoded": false,
                "statusCode": 200,
                "headers": { "license": newLicense, "id": headers.discordId },
                "body": newLicense
            }
        }
        catch (err) {throw err; }
    }
    else {
        return {
            "isBase64Encoded": false,
            "statusCode": 401,
            "body": "User already has a registered beta key"
        }
    }
}