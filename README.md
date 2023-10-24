## Table of Contents

# 1 Introduction
## 1.1 Glossary
## 1.2. References

# 2 Client registration

# 2 API specifications
## Authentication flow
### Initial request (/par)

OIDC requests are initiated via PAR (pushed authentication request). For this, a POST request with
content type `application/x-www-form-urlencoded` is sent to OIDC_SERVICE/par with the request body:


```
{
    'response_type': 'code',
    'client_id': 'CLIENT_ID',
    'redirect_uri': 'REDIRECT_URI',
    'state': 'STATE',
    'nonce': 'NONCE',
    'scope': 'openid',
    'code_challenge': 'CODE_CHALLENGE',
    'code_challenge_method': 'S256',
    'sid_confirmation_message': 'FREETEXT',
    'mid_confirmation_message': 'FREETEXT',
    'mid_confirmation_message_format': 'GSM-7'
}
```

| Parameter                       | Required | Value                                                                               | Description                                                                                                                                                                                                                                                                                                                                                                              |
|---------------------------------|----------|-------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| scope                           | Yes      | Must be 'openid' For age verification case additionally should be included ‘age_over’ or ‘age_under’ strings| A space-separated list of strings defines the scope of the authentication. 

All supported scope values must be explicitly configurable per client. By default, only openid shall be supported for client. An HTTP 400 invalid_scope error is returned if the scope parameter value contains a scope that is not permitted by the client registration.                                                                                                                                                                                                                                                                                |
| response-type                   | Yes      | Must be 'code'                                                                      | The authorization code flow is used                                                                                                                                                                                                                                                                                                                                                      |
| client-id                       | Yes      | Relying-party ID                                                                    | A pre-registered relying-party identifier                                                                                                                                                                                                                                                                                                                                                |
| redirect-uri                    | Yes      | Relying-party callback URL                                                          | A pre-registered relying party callback URL                                                                                                                                                                                                                                                                                                                                              |
| state                           | Yes      | unique random string                                                                | RP generated opaque value used to maintain state between the request and the callback. Can be used to mitigate replay and CSRF attacks                                                                                                                                                                                                                                                   |
| nonce                           | Yes      | unique random string                                                                | RP generated unique string. If provided, will be returned as a nonce claim in the id_token. Can be used to mitigate replay attacks                                                                                                                                                                                                                                                       |
| ui_locales                      | No       | Must be one of et, en, lv (or multiple in order of importance, separated by spaces) | End-User's preferred language for authentication. Determines the language used on the login page. The first found match with supported values will be set as the app language. If not set (or none are supported), app tries to determine the UI language from browser data etc. and defaults to 'en', if detection fails.                                                               |
| code-challenge                  | Yes      | Base64 encoded hash of a unique challenge                                           | Base64 encoded hash of a unique challenge (the code_verifier)                                                                                                                                                                                                                                                                                                                            |
| code-challenge-method           | Yes      | Must be 'S256'                                                                      | The algorithm by which the challenge shall be verified on the server side.                                                                                                                                                                                                                                                                                                               |
| sid_confirmation_message        | No       | String with information for users for the SID authentication app                    | Free text (max length 200 characters) value shown to Smart-ID users in the app during code choice. This can be the name of your service or provide more detailed info about the current interaction (like users name or order number etc).                                                                                                                                               |
| mid_confirmation_message        | No       | String with information for users for the MID authentication app                    | Free text (max length 40 characters for 'GSM-7', 20 characters for 'UCS-2') value shown to Mobile-ID users before asking authentication PIN.                                                                                                                                                                                                                                             |
| mid_confirmation_message_format | No       | Must be one of GSM-7, UCS-2                                                         | Specifies which characters and how many can be used in 'mid_confirmation_message'. GSM-7 allows 'mid_confirmation_message' to contain up to 40 characters from standard GSM 7-bit alpabet including up to 5 characters from extension table ( €[]^&#124;{}\ ) . UCS-2 allows up to 20 characters from UCS-2 alpabet (this has all Cyrillic characters, ÕŠŽ šžõ and ĄČĘĖĮŠŲŪŽ ąčęėįšųūž). |
| age_comparator 		  | No (Yes when scope includes "age_over" or "age_under") | int				  |  Age to do the age_over/age_under comparison against							 |


The oidc-service shall validate the authentication request and respond with a URI that the public
client can use to start authentication:

````
HTTP/1.1 201 Created
Cache-Control: no-cache, no-store
Content-Type: application/json
    
{
   "request_uri": "urn:ietf:params:oauth:request_uri:8Tw6nn6BAvoHBS5VM7M1UvndAAHdM5",
   "expires_in": 90
}
````
Please pay attention that client id and client secret should be passed in Authorization header of /par request in a format that OAuth 2.0 foresees for client secret authorization method.
According to OAuth 2.0. framework Authorization header must be in the Authorization: Basic encodedString format, where the encodedString is a result of Base64 encoding of OAuth client’s clientID:clientSecret.

Using the returned link, the app can open end-user's browser with the corresponding url.

### Authentication redirect (/authorize)

The app should open the link with an external user agent as recommended by current OAuth2 for native
clients best practices:

``
GET /authorize?client_id=EinLKYAAMqPr2Tw &request_uri=urn:ietf:params:oauth:request_uri:8Tw6nn6BAvoHBS5VM7M1UvndAAHdM5
``

After this, the user is redirected to the login service (located at OIDC_SERVICE/login)

### Response after successful authentication

A standard HTTP 302 authentication response redirect is returned to the end-user if a
successful authentication session exists. The redirect points user's browser back to RP's registered
redirect_uri where the RP shall verify the value of the state parameter.

``
HTTP/1.1 302 Found Location: https://client.example.org/callback?code=GaqukjWp4vvzEWHnLW7phLlwkpB0 &state=WDm4nExm1ADHzIEwoPxQ0KjBwnnk6NIrq178fU4rBDU
``

| Parameter    | Required | Value                | Description                                                                                                                 |
|--------------|----------|----------------------|-----------------------------------------------------------------------------------------------------------------------------|
| code         | Yes      | unique random string | A single-use, client-bound, short-lived authorization code, that can be used at OIDC token endpoint to redeem the id-token. |
| state        | Yes      | unique random string | RP's state parameter value specified in the Authorization Request                                                           |
| redirect_uri | Yes      | URL                  | RP's redirect_uri specified in the Authorization Request                                                                    |

### Requesting user info (/token)
Upon receiving the authorization code from the successful authentication response and having performed all checks required by OIDC core specification (state, csrf), the RP backend service posts a backchannel request to the oidc-service token endpoint:

```
POST /token HTTP/1.1
Host: auth.sk.ee
Content-Type: application/x-www-form-urlencoded
Authorization: Basic c2FtcGxlX2NsaWVudF8xOjNkc8OEMDIrMSwubTExMmxrMjPDtmxrw7ZsazMyMw

grant_type=authorization_code
&code=GaqukjWp4vvzEWHnLW7phLlwkpB0
&code_verifier=yJhbGciOiJSUzI1NiIsImtpZ
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
```

| Parameter     | Required | Value                        | Description                                                                                                |
|---------------|----------|------------------------------|------------------------------------------------------------------------------------------------------------|
| grant_type    | Yes      | Must be 'authorization_code' | Static value required by the OIDC core protocol.                                                           |
| code          | Yes      | Unique random string         | Authorization code value returned from the OIDC-service                                                    |
| code_verifier | Yes      | Unique random string         | The sha256 hash that was used as an input value for the code_challenge sent in the authentication request. |
| redirect_uri  | Yes      | URL                          | Must be identical to the parameter value that was included in the initial Authorization Request            |

The JSON response contains a signed JWT in the field id_token that contains claims about the authenticated end-user: 
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache
 
{
    "access_token": "SlAV32hkKG",
    "token_type": "Bearer",
    "refresh_token": null,
    "expires_in": 3600,
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZ...LrLl0nx7RkKU8NXNHq-rvKMzqg"
}
```

| Parameter    | Value                | Description                                      |
|--------------|----------------------|--------------------------------------------------|
| access_token | Unique random string | An opaque random string                          |
| token_type   | 'Bearer'             | Access token type. Will be 'Bearer'              |
| expires_in   | 600                  | Access token expiration time in seconds          |
| id_token     | JWT                  | A serialized and signed JWT with end-user claims |

The RP must validate the id_token signature and claims as specified in the OIDC core specification.

| Claim                             | Description                                                                                        |
|-----------------------------------|----------------------------------------------------------------------------------------------------|
| sub                               | Subject identifier                                                                                 |
| given_name, family_name, ...  etc | Standard claims that describe the end-user                                                         |
| jti                               | A unique identifier for the token, which can be used to prevent reuse of the token.                |
| iss                               | Issuer URL. Issuer identifier for the issuer of the response.                                      |
| aud                               | Audience that this ID Token is intended for. Contains the Relying Party ID as an audience value.   |
| iat                               | Time at which the JWT was issued.                                                                  |
| exp                               | Expiration time on or after which the ID Token MUST NOT be accepted for processing.                |
| nonce                             | String value. Used to associate a Client session with an ID Token, and to mitigate replay attacks. |
| amr                               | Authentication Methods References.                                                                 |
	
## Error tracing

User interface generates a random id on load (example: `95b69c87-aacc-49b3-9577-5a76491792e7`) that is used to trace requests made to services (like getting session information, initializing authentication etc). If a user is experiencing problems and records the incident number shown in the error message, it can be used to help diagnose the problem.
