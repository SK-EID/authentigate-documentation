## Table of Contents
* [Glossary](#glossary)
* [1 Introduction](#1-introduction)
  * [1.1 Key Benefits](#11-key-benefits)
  * [1.2 Supported Authentication Methods](#12-supported-authentication-methods)
  * [1.3 Service Configuration](#13-service-configuration)
* [2 Client Registration](#2-client-registration)
* [3 API Specifications](#3-api-specifications)
  * [3.1 Authentication Flows Supported](#31-authentication-flows-supported)
  * [3.2 Authentication Request Parameters](#32-authentication-request-parameters)
    * [3.2.1 Signed Authentication Request](#321-signed-authentication-request)
  * [3.3 Authentication Flow Using PAR](#33-authentication-flow-using-par)
    * [3.3.1 Initial Authentication Request (/par)](#331-initial-authentication-request-par)
    * [3.3.2 Authentication Redirect (/authorize)](#332-authentication-redirect-authorize)
  * [3.4 Authentication Flow Starting with Authorization Endpoint](#34-authentication-flow-starting-with-authorization-endpoint)
    * [3.4.1 Initial Authentication Request (/authorize)](#341-initial-authentication-request-authorize)
    * [3.4.2 Authentication Response](#342-authentication-response)
  * [3.5 Token Request (/token)](#35-token-request-token)
    * [3.5.1 Token Request Response](#351-token-request-response)
  * [3.6 Error Tracing](#35-error-tracing)

# Glossary
* Attribute - Any piece of information related to a person that can be optionally shared during an OIDC authentication transaction, providing additional user details. 
* Authentigate - A service developed by SK to offer attribute storage, calculation and sharing functionalities, allowing for the secure and controlled exchange of user information during authentication.
* RP (Relying Party) - An organization or service that utilizes the SK authentication gateway service to authenticate its users and verify their age.
* OIDC (OpenID Connect) - A protocol used for central authentication, facilitating secure user verification and attribute sharing.

# 1 Introduction
Welcome to the official documentation for Authentigate, a platform designed to enable e-services (Relying Parties) to request verified information about users in an automatic, secure, and GDPR-compliant manner. Authentigate is a robust identity verification platform that allows Relying Parties to securely request and receive verified personal information about users. This process is streamlined through the OpenID Connect (OIDC) protocol, ensuring seamless integration with various e-services.

This documentation will guide you through the integration, configuration, and use of Authentigate service. Whether you're a developer, a relying party, or simply interested in learning more, this documentation is your gateway to harnessing the power of our service. Let's get started on this journey to better authentication and data security.

## 1.1 Key Benefits 
* Fast and Secure Information Sharing: Relying Parties can quickly receive verified user data, while users retain full transparency over which information is being shared.    
* Easy Integration: Connecting to the OIDC portal is simplified through a single integration based on the OpenID Connect protocol. The unified API supports various authentication methods, such as Smart-ID, Mobile-ID and other.   
* GDPR Compliance: Relying Parties can request only the information they need, helping them remain GDPR-compliant.
* Possibility to verify the compliance to certain conditions without revealing actual personal details (e.g. by age comparison, verifying if an end-user is over a certain age without returning their actual age).

## 1.2 Supported Authentication Methods
Authentigate currently supports multiple eID authentication methods in different regions:
* Latvia: Smart-ID
* Lithuania: Smart-ID and Mobile-ID
* Estonia: Smart-ID, Mobile-ID, and ID-Card

Authentigate is also planning to expand its range of supported eID solutions in the future to enhance coverage and accessibility across more regions and use cases.
Using the acr_value parameter, a relying party can specify which countries and authentication methods (e.g., Smart-ID, Mobile-ID, ID-Card) should be offered to the end user during the authentication process. 

## 1.3 Service Configuration
The service configuration metadata, such as supported attributes, endpoints, scopec, et can be requested from the discovery endpoint `/.well-known/openid-configuration`.
<br>Regarding end-user info, various attributes are supported:
* For user Identification: personal code, personal code issuing country, given name, family name, full name, birthdate.
* For age Verification: age, age over, age under.

# 2 Client Registration
> [!IMPORTANT]
> To initiate the registration process, we kindly request you to get in touch with our **Sales team**. You can find their contact information on our [Contact Us](https://www.skidsolutions.eu/contact/) page.

Each client MUST be registered with the following required info:
| Parameter | Required | Description | Info | Example | Default |
|-|-|-|-|-|-|
| client-id | Yes | A preregistered OIDC client ID. Generated by OIDC Provider | | | |
| client-secret | Yes | Client secret used for client authentication (Basic authentication). Generated by OIDC Provider | | | |
| redirect-uri[] | Yes | A list of allowed callback URIs whitelisted for this client | 1 or many URIs | https://example.com/callback  | |
| ip-patterns[]  | Yes | A list of allowed IP patterns allowed for this client to access /token and /par endpoints |   | `192.168.12.*`, `192.168.*`  | |
| allowed-countries[] | No | A list of allowed countries this client    |  | `EE`, `LV`, `LT`    |  |
| name | Yes | Client full name, shown in frontend | Sample RP  | |   |

Additionally, optional paramaters MAY be configured for a RP:
| Parameter | Required | Description | Info | Example | Default |
|-|-|-|-|-|-|
| sector-identifier-uri   | No | HTTPS URL that points to a JSON file containing an array of the client's `redirect_uri` values | Required if multiple `redirect_uris` are registered | https://example.com/redirecti_uris.json | |
| logo  | No | Logo encoded in base64, preferably svg for removing issues with different user screen resolutions  | base64 string  |  | |
| background-color  | No | Frontend background color, in hex format   | | `#ff0000`  | |
| jwks[]  | No  | A list of JWK public keys to be used for validation in case 'private_key_jwt' authentication method is chosen |  | https://datatracker.ietf.org/doc/html/rfc7517#appendix-A.1 | |

# 3 API specifications
## 3.1 Authentication Flows Supported

The Authentigate service supports two endpoints for initiating authentication:
* Authorization endpoint (**/authorize**), using POST or GET request after which the user is redirected to login service at OIDC_SERVICE/login.
* Pushed Authentication Request, PAR (**/par**) where Authentigate service validates the POST request and responds with a URI for starting authentication.

## 3.2 Authentication Request Parameters

Regardless of authentication flow, the Authentication Request MUST include all required parameters (per parameter, this may vary depending on the flow used - this is highlighted in the table below).
Including non-required parameters is optional. 
Authentigate supports both signed and unsigned Authentication Requests. For passing request parameters as JWT, `request` parameter must be used (see Section [3.2.1](#321-signed-authentication-request)).

Authentication Request parameters:

| Parameter | Required | Value | Description |
|-|-|-|-|
| scope | Yes | Must contain 'openid'. Supported scopes can also be retrieved from /.well-known/openid-configuration <sup> 1 </sup> | Static value required by OIDC core protocol and additional user information relying party needs. Values separated by spaces. |
| age_comparator | No<br/>(Yes, when scope includes `age_over` or `age_under`) | Integer | Specifies against which age should comparison be made |
| response_type  | Yes  | Must be 'code'  | The authorization code flow is used |
| client_id      | Yes  | Relying-party ID  | A pre-registered relying-party identifier |
| redirect_uri   | Yes (No, in case of signed request)  | Relying-party callback URL  | A pre-registered relying party callback URL |
| state          | Yes (No, in case of signed request)   | Unique random string | RP generated opaque value used to maintain state between the request and the callback. Can be used to mitigate replay and CSRF attacks |
| nonce          | No   | Unique random string  | RP generated unique string. If provided, will be returned as a nonce claim in the id_token. Can be used to mitigate replay attacks  |
| ui_locales     | No   | Must be one of et, en, lv, lt (or multiple in order of importance, separated by spaces) | End-User's preferred language for authentication. Determines the language used on the login page. The first found match with supported values will be set as the app language. If not set (or none are supported), app tries to determine the UI language from browser data etc. and defaults to 'en' if detection fails. |
| code_challenge | No<br/>(Yes, in case of basic authentication)   | Base64 encoded hash of a unique challenge. | Base64 encoded hash of a unique challenge. The code-challenge is created by SHA256 hashing the code_verifier and base64 URL encoding the resulting hash Base64UrlEncode(SHA256Hash(code_verifier)). You can view an example from https://tonyxu-io.github.io/pkce-generator/.<br/> NB! Must be present if not using JWT authentication. |
| code_challenge_method | No<br/>(Yes, in case of basic authentication)  | Must be 'S256'. | The algorithm by which the challenge shall be verified on the server side. Must be present if client 'code-challenge-required' is true or if not using JWT authentication. |
| sid_confirmation_message  | No | String with information for users for the SID authentication app | Free text (max length 200 characters) value shown to Smart-ID users in the app during code choice. This can be the name of your service or provide more detailed info about the current interaction (like users name or order number etc).  |
| mid_confirmation_message  | No | String with information for users for the MID authentication app | Free text (max length 40 characters for 'GSM-7', 20 characters for 'UCS-2') value shown to Mobile-ID users before asking authentication PIN. |
| mid_confirmation_message_format | No | Must be one of GSM-7, UCS-2  | Specifies which characters and how many can be used in 'mid_confirmation_message'. GSM-7 allows 'mid_confirmation_message' to contain up to 40 characters from standard GSM 7-bit alpabet including up to 5 characters from extension table ( €[]^&#124;{}\ ) . UCS-2 allows up to 20 characters from UCS-2 alpabet (this has all Cyrillic characters, ÕŠŽ šžõ and ĄČĘĖĮŠŲŪŽ ąčęėįšųūž). | 
| acr_values     | No | Space separated string containing one or more of the following values: `http://eidas.europa.eu/LoA/high`, `http://eidas.europa.eu/LoA/substantial`, `mid`, `mid_ee`, `mid_lt`, `sid`, `sid_ee`, `sid_lv`, `sid_lt`, `idcard`, `idcard_ee` | Optional value specifying authentication methods to be usable by the end-user.<br/><br/>Order of provided values affects the presentation of authentication options to the end-user. Acr values that appear earlier will be prioritized. Example order:<br/><br/> `mid_lt mid_ee sid_lv sid_lt sid_ee` - LT (MID, SID), EE (SID, MID), LV (SID). Please note that requesting authentication methods with LoA 'substantial' is supported but would result in error as all currently available authentication methods are recognized as 'high'. |
| request                         | No<br/>(Yes, if RP wishes to pass request parameters in JWT | Request parameters which the RP wishes to pass in a single, self-contained parameter                                                                                                                                                      | Parameter representing the request as a JWT whose Claims are the request parameters            |

<sup> 1 </sup> *Supported scope values for requesting end-user attributes are as follows:*

| Scope claim | Description |
|-|-|
| `family_name` | Family name |
| `given_name` | First name |
| `birthdate` | Date of birth |
| `https://id.authentigate.eu/claims/name` | Full name |
|	`https://id.authentigate.eu/claims/personal_code` | Personal identification code |
| `https://id.authentigate.eu/claims/eid_issuing_country` | Country code that has issued the personal identification code|
| `https://id.authentigate.eu/claims/age` | Actual age |
| `https://id.authentigate.eu/claims/age_under` | Verification of end-user being under certain age - if requested in scope, the parameter `age_comparator` must be provided in request |
| `https://id.authentigate.eu/claims/age_over` |  Verification of end-user being over certain age - if requested in scope, the parameter `age_comparator` must be provided in request |

### 3.2.1 Signed Authentication Request

Request parameters can be passed also as JWTs by using the `request` parameter. 
This parameter represents the request claims as JWT (Request Object) whose claims are the request parameters. Any of the request parameters as in Section [3.2](#32-authentication-request-parameters) can be passed using the `request` parameter (the same conditions to authentication request parameters apply (required vs optional, value)).
Note that `response_type`, `client_id` and `scope` MUST be included in the request root level. These MAY also be included in the JWT - in that case the values inside and outside JWT MUST match.
On root level, the `scope` parameter MUST contain the `openid` scope value.
If any parameter is included both outside AND inside JWT Request Object, the ones inside  prevail when processed by authorization server.

When passing authentication request in a signed JWT, the JWT own claims are: 
| Claim     | Required   | Value                                                    |
|-----------|------------|----------------------------------------------------------|
| `iss`     | Yes        | Must equal "client_id"                                   |
| `sub`     | Yes        | Must equal "client_id"                                   |
| `aud`     | Yes        | Must be authorization server /token endpoint             |
| `jti`     | Yes        | Unique JWT ID used for verifying one-time use of JWT     |
| `exp`     | Yes        | JWT expiration time; after passing JWT is not accepted   |
| `iat`     | No         | Time of JWT generation                                   |

*JWT example:*
```
{
  "iss": "bank321",
  "sub": "bank321",
  "aud": "https://httpd-proxy",
  "iat": 1747899848,
  "exp": 1747903448,
  "jti": "e212513d-f78d-45a3-8834-d68db5f4c4c7",
  "client_id": "bank321",
  "scope": "openid age_over personal_code given_name family_name name birthdate",
  "response_type": "code",
  "redirect_uri": "https://httpd-proxy/tester/callback/",
  "state": "af0ifjsldkj",
  "nonce": "n-0S6_WzA2Mj",
  "code_challenge": "hKpKupTM391pE10xfQiorMxXarRKAHRhTfH_xkGf7U4",
  "code_challenge_method": "S256",
  "ui_locales": "et en",
  "acr_values": "mid_ee mid_lt sid idcard",
  "age_comparator": "18"
}
```

Supported cryptographies in signed JWT: RS256, RSA using SHA-256.

Authorization server validates JWT signature and payload fields on the JWT according to OpenID Connect specifications.
Please note that using `request_uri` parameter is not supported!

## 3.3 Authentication Flow Using PAR

### 3.3.1 Initial Authentication Request (`/par`)

OIDC requests are initiated via PAR (pushed authentication request). For this, a **POST** request with parameters formatted with application/x-www-form-urlencoded using a character encoding of UTF-8 is sent to `OIDC_SERVICE/par`.
See the request parameters described at Section [3.2](#32-authentication-request-parameters).

*PAR flow authentication request, Example 1:* Request person's full name and a verification that the person is over 18 years old
```json
{
    "response_type": "code",
    "client_id": "CLIENT_ID",
    "redirect_uri": "REDIRECT_URI",
    "state": "STATE",
    "nonce": "NONCE",
    "scope": "openid https://id.authentigate.eu/claims/name https://id.authentigate.eu/claims/age_over",
    "acr_values": "http://eidas.europa.eu/LoA/high",
    "age_comparator": "18",
    "code_challenge": "CODE_CHALLENGE",
    "code_challenge_method": "S256",
    "sid_confirmation_message": "FREETEXT",
    "mid_confirmation_message": "FREETEXT",
    "mid_confirmation_message_format": "GSM-7"
}
```

*PAR flow authentication request, Example 2:* Request person's given name, family name, and age
```json
{
    "response_type": "code",
    "client_id": "CLIENT_ID",
    "redirect_uri": "REDIRECT_URI",
    "state": "STATE",
    "nonce": "NONCE",
    "scope": "openid https://eidas.europa.eu/attributes/naturalperson/FirstName https://eidas.europa.eu/attributes/naturalperson/FamilyName https://id.authentigate.eu/claims/age",
    "acr_values": "http://eidas.europa.eu/LoA/high",
    "code_challenge": "CODE_CHALLENGE",
    "code_challenge_method": "S256",
    "sid_confirmation_message": "FREETEXT",
    "mid_confirmation_message": "FREETEXT",
    "mid_confirmation_message_format": "GSM-7"
}
```
Please pay attention that client id and client secret should be passed in `Authorization` header of `/par` request in a format that OAuth 2.0 foresees for client secret authorization method.  
According to OAuth 2.0 framework, `Authorization` header must be in the `Authorization: Basic encodedString` format, where the `encodedString` is a result of Base64 encoding of OAuth client’s `clientID:clientSecret`.

The oidc-service shall validate the authentication request and respond with a URI that the public client can use to start authentication.

*Authentication request response example:*
```
HTTP/1.1 201 Created
Cache-Control: no-cache, no-store
Content-Type: application/json
    
{
   "request_uri": "urn:ietf:params:oauth:request_uri:8Tw6nn6BAvoHBS5VM7M1UvndAAHdM5",
   "expires_in": 90
}
```

Using the returned link, the app can open end-user's browser with the corresponding url.

### 3.3.2 Authentication Redirect (`/authorize`)

The app should open the link with an external user agent as recommended by current OAuth2 for native clients best practices:

```
GET /authorize?client_id=EinLKYAAMqPr2Tw &request_uri=urn:ietf:params:oauth:request_uri:8Tw6nn6BAvoHBS5VM7M1UvndAAHdM5
```

After this, the user is redirected to the login service (located at OIDC_SERVICE/login).
After authentication, Token can be requested: see Section [3.5 Token Request (/token)](#35-token-request-token) and Section [3.5.1 Token Request Response](#351-token-request-response)

## 3.4 Authentication flow starting with authorization endpoint 
### 3.4.1 Initial Authentication Request (`/authorize`)

OIDC requests are initiated via authorization endpoint. A **POST** or **GET** request with parameters formatted with `application/x-www-form-urlencoded` using a character encoding of UTF-8 is sent to `OIDC_SERVICE/authorize`.
See the request parameters described at Section [3.2](#32-authentication-request-parameters).

*POST request body example, requesting all scopes:*
```json
{
    "response_type": "code",
    "client_id": "CLIENT_ID",
    "redirect_uri": "REDIRECT_URI",
    "state": "STATE",
    "nonce": "NONCE",
    "scope": "openid",
    "acr_values": "http://eidas.europa.eu/LoA/high",
    "code_challenge": "CODE_CHALLENGE",
    "code_challenge_method": "S256",
    "sid_confirmation_message": "FREETEXT",
    "mid_confirmation_message": "FREETEXT",
    "mid_confirmation_message_format": "GSM-7"
}
```

*GET request with Query string example:*
```
OIDC_SERVICE/authorize?scope=openid&response_type=code&redirect_uri=REDIRECT_URI&state=STATE&nonce=NONCE&code_challenge=CODE_CHALLENGE&code_challenge_method=S256
```

The user is redirected to the login service (located at `OIDC_SERVICE/login`).

### 3.4.2 Authentication Response

A standard HTTP 302 authentication response redirect is returned to the end-user if a successful authentication session exists. 
The redirect points user's browser back to RP's registered `redirect_uri` where the RP shall verify the value of the `state` parameter.

Successful Response parameters:

| Parameter    | Required | Value                | Description                                                                                                                 |
|--------------|----------|----------------------|-----------------------------------------------------------------------------------------------------------------------------|
| code         | Yes      | unique random string | A single-use, client-bound, short-lived authorization code, that can be used at OIDC token endpoint to redeem the id-token. |
| state        | Yes      | unique random string | RP's state parameter value specified in the Authorization Request                                                           |
| redirect_uri | Yes      | URL                  | RP's redirect_uri specified in the Authorization Request                                                                    |

*HTTP 302 response example:*
```
HTTP/1.1 302 Found Location: https://client.example.org/callback?code=GaqukjWp4vvzEWHnLW7phLlwkpB0 &state=WDm4nExm1ADHzIEwoPxQ0KjBwnnk6NIrq178fU4rBDU
```

Unsuccessful response includes error, error description and `state` parameter value (must match with the value in request).

*Unsuccessful response example:*
```
HTTP/1.1 302 Found
  Location: https://client.example.org/cb?
    error=invalid_request
    &error_description=
      Request_uri%20invalid%20or%20expired
    &state=af0ifjsldkj
```

## 3.5 Token Request (`/token`)

Upon receiving the authorization code from the successful authentication response and having performed all checks required by OIDC core specification (state), the RP backend service posts a backchannel request to the oidc-service `/token` endpoint.

Token request parameters:

| Parameter | Required | Value | Description |
|-|-|-|-|
| grant_type | Yes | Must be `authorization_code` | Static value required by the OIDC core protocol |
| code | Yes | Unique random string | Authorization code value returned from the OIDC-service |
| code_verifier | No | Unique random string | High-entropy cryptographic random string. Related to code-challenge given in par request. Must be present if client 'code-challenge-required' is true or if not using JWT authentication |
| client_assertion_type | No | If present, must be 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' | Static value required by the OIDC core protocol. Must be present only if 'client_assertion' field is also present |
| client_assertion | No | Valid signed JWT | Must contain a single valid JSON Web Token. Must be present only if 'client_assertion_type' field is also present |
| redirect_uri | Yes | URL | Must be identical to the parameter value that was included in the initial Authorization Request |

When passing token request in a signed JWT, the JWT own claims are:

| Claim     | Required   | Value                                                    |
|-----------|------------|----------------------------------------------------------|
| `iss`     | Yes        | Must equal "client_id"                                   |
| `sub`     | Yes        | Must equal "client_id"                                   |
| `aud`     | Yes        | Must be authorization server /token endpoint             |
| `jti`     | Yes        | Unique JWT ID used for verifying one-time use of JWT     |
| `exp`     | Yes        | JWT expiration time; after passing JWT is not accepted   |
| `iat`     | No         | Time of JWT generation                                   |

`Authorization`: basic authentication with client-id and client-secret; only required in case of `client_secret_basic` authentication method. 
Header MUST NOT be present in case of `private_key_jwt` authentication method. See the examples below.

*Token request examples:*
* Using `client_secret_basic` authentication:
```
POST /token HTTP/1.1
Host: oidc.demo.sk.ee
Content-Type: application/x-www-form-urlencoded
Authorization: Basic c2FtcGxlX2NsaWVudF8xOjNkc8OEMDIrMSwubTExMmxrMjPDtmxrw7ZsazMyMw

grant_type=authorization_code
&code=GaqukjWp4vvzEWHnLW7phLlwkpB0
&code_verifier=yJhbGciOiJSUzI1NiIsImtpZ
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
```

or

* Using `private_key_jwt` authentication:
```
POST /token HTTP/1.1
Host: oidc.demo.sk.ee
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=GaqukjWp4vvzEWHnLW7phLlwkpB0
&code_verifier=yJhbGciOiJSUzI1NiIsImtpZ
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJqdGkiOiAiY2ZiMDM5NGEtY2JlOS00MGE4LWEyNDQtZmNlM2Y0MTljNmRhIiwKICAic3ViIjogImJhbmsxMjMiLAogICJpc3MiOiAiYmFuazEyMyIsCiAgImF1ZCI6ICJodHRwczovL2F1dGguc2suZWUvdG9rZW4iLAogICJleHAiOiAxNzE0OTM3NjEwLAogICJpYXQiOiAxNzE0MDM3NjEwCn0=.zK6oUoDcxm-9w7hYpI8-IYlJr55k-S0LY0XvKDdBsuz8AJnZ6JEFS3GS_04SNVP02dqHq44ZGUbpRxkkAOJ8Su2zn7iJGaqr_MLchxddQiYYpHdOiKYqIQ-Yn3oleTlHed0ci84Kh7-BEQB_u7nv2-76wOe339OrHZuNeqejmGeQtMG7vzX5PMDF4wLjvrAxTIptTBKBWLGO02RusEI4uAC-4FrMjjbM4Ygc8U_i8BtZ-Is2FptJlpIAqjMTvGQZdEfenNZWzmVTYn9qKJ3ArXPZg5R07vqsx2YpMenXjbBc5TRS2FTVskwWvfTZn9_ygVvwR1wAzfNNfp7XPcQuUg
&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcallback
```
### 3.5.1 Token Request Response

Authorization server validates the Token request as described in OpenID Connect Core 1.0 section 3.1.3.2.

If token request is invalid, authorization server constructs the error response with HTTP response code 400.

*Token error response example:*
```
  HTTP/1.1 400 Bad Request
  Content-Type: application/json
  Cache-Control: no-store
  Pragma: no-cache

  {
   "error": "invalid_grant",
   "error_description": "The provided authorization code is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client."
  }
```

If token request validation is successful, authorization server returns a an application/json media type response that includes ID token and access token.
The ID token is a signed JWT that contains token claims, including the requested attributes of authenticated end-user. 

On authorization server side, the session expires in 60 seconds.

Token response parameters:

| Parameter    | Value                | Description                                      |
|--------------|----------------------|--------------------------------------------------|
| access_token | Unique random string | An opaque random string                          |
| scope        | Requested scopes     | Scope values as requested                        |
| expires_in   | Expiration time in seconds | | 
| id_token     | JWT                  | A serialized and signed JWT, including end-user claims requested in scope |
| token_type   | `Bearer`             | Access token type           |

*Token success response example:*
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache
 
{
    "access_token": "SlAV32hkKG",
    "token_type": "Bearer",
    "scope": "openid https://id.authentigate.eu/claims/age_under"
    "expires_in": 3600,
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZ...LrLl0nx7RkKU8NXNHq-rvKMzqg"
}
```
The RP must validate the id_token signature and claims as specified in the OIDC core specification.

Decoded ID-token claims:
| Claim            | Required in token | Description |
|-|-|-|
| sub              | Yes | Pairwise subject unique identifier |
| amr              | Yes | Authentication Methods References  |
| iss              | Yes | Issuer URL. Issuer identifier for the issuer of the response |
| response_type    | Yes | Authentication flow requested response type used | 
| age_comparator   | No | Age comparison value from request (required if was provided in request) |
| code_challenge_method | No | Code challenge method - S256 or PLAIN |
| nonce            | No | String value. Used to associate a Client session with an ID Token, and to mitigate replay attacks |
| client_id        | Yes | RP id associated with the authentication flow  |
| aud              | Yes | Audience that this ID Token is intended for. Contains the Relying Party ID as an audience value |
| acr              | Yes | Authentication Context Class Reference |
| ui_locales       | No | Authentication Context Class Reference |
| scope            | Yes | RP-requested scope |
| acr_values       | Yes | acr_values value from request |
| attribues.*      | Yes | Key-value map of end-user info claims as requested by RP in scope |
| redirect_uri     | Yes | RP-provided redirect url |   
| state            | Yes | RP-provided state value |
| exp              | Yes | Expiration time on or after which the ID Token MUST NOT be accepted for processing |
| iat              | Yes | Time at which the JWT was issued  |
| code_challenge   | No | Code challenge associated with the authorization code |
| jti              | Yes | A unique identifier for the token, which can be used to prevent reuse of the token |


### 3.6 Error Tracing

**/par endpoint**

*/par response errors*

| HTTP status code | Error code        | Description                                                                                                |
|------------------|-------------------|------------------------------------------------------------------------------------------------------------|
| 405              | invalid_request   | Method [{0}] not allowed for URI [/par]. Allowed methods: [POST]                                           |
| 413              | invalid_request   | The content length [{0}] exceeds the maximum allowed content length [{1}]                                  |
| 415              | invalid_request   | Content Type [{0}] not allowed. Allowed types: [application/x-www-form-urlencoded]                         |
| 429              | too_many_requests | Too many pending PAR requests                                                                              |
| 500              | server_error      | The authorization server encountered an unexpected condition that prevented it from fulfilling the request |

*/par - request validation errors*

| HTTP status code | Error code                | Description                                                                                                                     | Parameter causing the error     |
|------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| 400              | invalid_scope             | The requested scope is invalid. Client: [%s] is not allowed to request scope value(s): %s                                       | scope                           |
| 400              | unsupported_response_type | The authorization server does not support obtaining an authorization code using this method.                                    | response_type                   |
| 400              | invalid_request           | Missing client_id parameter                                                                                                     | client_id                       |
| 400              | invalid request           | authorization request not found for provided uri                                                                                |                                 |
| 400              | invalid request           | Missing state parameter                                                                                                         | state                           |
| 400              | invalid request           | SID confirmation message too long                                                                                               | sid_confirmation_message        |
| 400              | invalid request           | MID confirmation message too long                                                                                               | mid_confirmation_message        |
| 400              | invalid request           | Missing mid_confirmation_message_format parameter                                                                               | mid_confirmation_message_format |
| 400              | invalid request           | mid_confirmation_message_format must be one of: GSM-7, UCS-2                                                                    | mid_confirmation_message_format |
| 400              | invalid request           | Missing age_comparator parameter when using age_over or age_under scope                                                         | age_comparator                  |
| 400              | invalid request           | Missing code_challenge parameter                                                                                                | code_challenge                  |
| 400              | invalid request           | Parameter value for code_challenge_method is not supported. Supported values are: %s                                            | code_challenge_method           |
| 400              | invalid request           | Missing code_challenge_method parameter                                                                                         | code_challenge_method           |
| 400              | invalid request           | Invalid redirect_uri.                                                                                                           | redirect_uri                    |
| 400              | invalid request           | Invalid acr_values provided. Client: [%s] is not allowed to use acr [%s]                                                        | acr_values                      |
| 400              | invalid request           | Invalid acr values: %s. Supported values are: %s                                                                                | acr_values                      |
| 401              | invalid_client            | Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).   |                                 |


**/authorize endpoint**

*/authorize response errors*

| HTTP status code  | Error code        | Description                                                      |
|-------------------|-------------------|------------------------------------------------------------------|
| 400               | invalid_request   | Request_uri invalid or expired                                   |
| 400               | user_cancel       | User canceled authentication                                     |


*/authorize - standard flow*

| HTTP status code | Error code                | Description                                                                                                                     | Parameter causing the error     |
|------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| 400              | invalid_scope             | The requested scope is invalid. Client: [%s] is not allowed to request scope value(s): %s                                       | scope                           |
| 400              | unsupported_response_type | The authorization server does not support obtaining an authorization code using this method.                                    | response_type                   |
| 400              | invalid_request           | Missing client_id parameter                                                                                                     | client_id                       |
| 400              | invalid_request           | Missing required parameters - request_uri or %s                                                                                 | request_uri                     |
| 400              | invalid_request           | Missing state parameter                                                                                                         | state                           |
| 400              | invalid_request           | Parameter value for code_challenge_method is not supported. Supported values are: %s                                            | code_challenge_method           |
| 400              | invalid_request           | SID confirmation message too long                                                                                               | sid_confirmation_message        |
| 400              | invalid_request           | Missing mid_confirmation_message_format parameter                                                                               | mid_confirmation_message_format |
| 400              | invalid_request           | mid_confirmation_message_format must be one of: GSM-7, UCS-2                                                                    | mid_confirmation_message_format |
| 400              | invalid_request           | MID confirmation message too long                                                                                               | mid_confirmation_message        |
| 400              | invalid_request           | Missing age_comparator parameter when using age_over or age_under scope                                                         | age_comparator                  |
| 400              | invalid_request           | Invalid acr values: [%s]. Supported values are: [%s]                                                                            | acr_values                      | 
| 400              | invalid_request           | Missing code_challenge parameter                                                                                                | code_challenge                  |
| 400              | invalid_request           | Missing code_challenge_method parameter                                                                                         | code_challenge_method           |
| 400              | invalid_request           | Invalid redirect_uri.                                                                                                           | redirect_uri                    |
| 400              | invalid_request           | Invalid acr_values provided. Client: [%s] is not allowed to use acr [%s]                                                        | acr_values                      |
| 401              | invalid_client            | Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).   |                                 |

*/authorize - JWT flow*

| HTTP status code | Error code                | Description                                                                                                                     | Parameter causing the error     |
|------------------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| 400              | invalid_scope             | The requested scope is invalid. Client: [<client_id>] is not allowed to request scope value(s): [<scope values in the request>] | scope                           |
| 400              | unsupported_response_type | The authorization server does not support obtaining an authorization code using this method                                     | response_type                   |
| 400              | invalid_request           | Missing client_id parameter                                                                                                     | client_id                       |
| 400              | invalid_request           | Missing scope parameter                                                                                                         | scope                           |
| 400              | invalid_request           | The scope must include an openid value                                                                                          | scope                           |
| 400              | invalid_request           | Invalid redirect_uri.                                                                                                           | redirect_uri                    |
| 400              | invalid_request           | Missing response_type parameter                                                                                                 | response_type                   | 
| 400              | invalid_request           | Unsupported response_type parameter: Unsupported OpenID Connect response type value: invalid_type                               | response_type                   |
| 400              | invalid_request           | Missing client_id parameter                                                                                                     | client_id                       |
| 400              | invalid_request           | Missing redirect_uri parameter                                                                                                  | redirect_uri                    |
| 400              | invalid_request           | Missing state parameter                                                                                                         | state                           |
| 400              | invalid_request           | Missing nonce parameter                                                                                                         | nonce                           |
| 400              | invalid_request           | Invalid acr values: [%s]. Supported values are: [%s]                                                                            | acr_values                      | 
| 400              | invalid_request           | Invalid acr_values provided. Client: <client_id> is not allowed to use acr [<invalid acr value>]                                | acr_values                      |
| 400              | invalid_request           | Missing code_challenge parameter                                                                                                | code_challenge                  |
| 400              | invalid_request           | Missing code_challenge_method parameter                                                                                         | code_challenge_method           |
| 400              | invalid_request           | Parameter value for code_challenge_method is not supported. Supported values are: [%s]                                          | code_challenge_method           |
| 400              | invalid_request           | SID confirmation message too long                                                                                               | sid_confirmation_message        |    
| 400              | invalid_request           | MID confirmation message too long                                                                                               | mid_confirmation_message        | 
| 400              | invalid_request           | Missing mid_confirmation_message_format parameter                                                                               | mid_confirmation_message_format |
| 400              | invalid_request           | mid_confirmation_message_format must be one of: GSM-7, UCS-2                                                                    | mid_confirmation_message_format |
| 400              | invalid_request           | Missing age_comparator parameter when using age_over or age_under scope                                                         | age_comparator                  |
| 400              | invalid_request           | Missing required parameters - [%s]                                                                                              |                                 |
| 400              | invalid_request           | Invalid signed request JWT                                                                                                      |                                 |  
| 400              | invalid_request           | Failed to extract claims from JWT                                                                                               |                                 |
| 400              | invalid_request           | Invalid 'iss' value.                                                                                                            |                                 |
| 400              | invalid_request           | Signed request 'iss' does not match provided client_id.                                                                         |                                 |
| 400              | invalid_request           | Invalid client assertion.                                                                                                       |                                 |
| 400              | invalid_request           | Invalid 'jti' value.                                                                                                            |                                 |
| 400              | invalid_request           | Invalid 'exp' value.                                                                                                            |                                 |
| 400              | invalid_request           | Invalid 'iat' value.                                                                                                            |                                 |
| 400              | invalid_request           | Invalid 'aud' for request object (none provided).                                                                               |                                 |
| 400              | invalid_request           | Invalid 'aud' for request object (must match OP issuer).                                                                        |                                 |
| 400              | invalid_request           | Invalid 'sub' value: must match client_id                                                                                       |                                 |
| 400              | invalid_request           | Parameter 'request' is not allowed inside signed 'request' JWT parameter.                                                       |                                 |
| 400              | invalid_request           | Parameter 'client_id' included in signed 'request' JWT parameter does not match the one provided in request.                    |                                 |
| 400              | invalid_request           | Parameter 'response_type' included in signed 'request' JWT parameter does not match the one provided in request.                |                                 |
| 400              | invalid_request           | Parameter 'scope' included in signed 'request' JWT parameter does not match the one provided in request.                        |                                 |
| 400              | invalid_request           | Failed to build request from AuthorizeRequest                                                                                   |                                 |
| 401              | invalid_client            | Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).   |                                 |
  

**/token endpoint**
  

*/token - JWT flow*  
  
| HTTP status code | Error code             | Description                                                                                                                                                                                                                                                          |
|------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| 
| 400              | invalid_request        | Required Body [tokenRequest] not specified                                                                                                                                                                                                                           |
| 400              | invalid_request        | 'grant’ must not be blank                                                                                                                                                                                                                                            |
| 400              | invalid_request        | 'code’ must not be blank                                                                                                                                                                                                                                             |
| 400              | invalid_request        | Invalid client assertion type.                                                                                                                                                                                                                                       |
| 400              | invalid_request        | 'redirectUri’ must not be null                                                                                                                                                                                                                                       |
| 400              | invalid_request        | Missing 'client_assertion’ parameter.                                                                                                                                                                                                                                | 
| 400              | invalid_request        | Missing 'client_assertion_type' parameter.                                                                                                                                                                                                                           | 
| 400              | invalid_request        | Session is expired.                                                                                                                                                                                                                                                  |
| 400              | invalid_request        | Missing code_verifier parameter                                                                                                                                                                                                                                      |
| 400              | invalid_request        | No code_challenge parameter was provided previously                                                                                                                                                                                                                  |
| 400              | invalid_request        | authorization request not found for provided uri                                                                                                                                                                                                                     |
| 400              | invalid_request        | The request is missing a required parameter, includes an unsupported parameter value (other than grant type),<br/>repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client,<br/>or is otherwise malformed. |
| 400              | invalid_request        | Invalid client assertion.                                                                                                                                                                                                                                            |
| 400              | invalid_request        | Invalid 'iss' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_request        | Invalid 'sub' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_request        | Invalid 'jti' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_request        | Invalid 'aud' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_request        | Invalid 'exp' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_request        | Invalid 'iat' value.                                                                                                                                                                                                                                                 |
| 400              | invalid_grant          | The provided authorization code is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.                                                                                                 |
| 400              | unsupported_grant_type | The authorization grant type is not supported by the authorization server.                                                                                                                                                                                           | 
| 401              | invalid_client         | Authenticated client id (%s) and session client value (%s) do not match                                                                                                                                                                                              |
| 401              | invalid_client         | Authenticated client id (%s) and authentication request client value (%s) do not match                                                                                                                                                                               |
| 401              | invalid_client         | Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).                                                                                                                                        |


*/token - basic authentication flow*
  
| HTTP status code | Error code             | Description                                                                                                                                                                                                                                                          |
|------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| 
| 400              | invalid_request        | Required Body [tokenRequest] not specified                                                                                                                                                                                                                           |
| 400              | invalid_request        | 'grant’ must not be blank                                                                                                                                                                                                                                            |
| 400              | invalid_request        | 'code’ must not be blank                                                                                                                                                                                                                                             |
| 400              | invalid_request        | Invalid client assertion type.                                                                                                                                                                                                                                       |
| 400              | invalid_request        | 'redirectUri’ must not be null                                                                                                                                                                                                                                       |
| 400              | invalid_request        | Missing 'client_assertion’ parameter.                                                                                                                                                                                                                                | 
| 400              | invalid_request        | Missing 'client_assertion_type' parameter.                                                                                                                                                                                                                           | 
| 400              | invalid_request        | Session is expired.                                                                                                                                                                                                                                                  |
| 400              | invalid_request        | Missing code_verifier parameter                                                                                                                                                                                                                                      |
| 400              | invalid_request        | No code_challenge parameter was provided previously                                                                                                                                                                                                                  |
| 400              | invalid_request        | authorization request not found for provided uri                                                                                                                                                                                                                     |
| 400              | invalid_request        | The request is missing a required parameter, includes an unsupported parameter value (other than grant type),<br/>repeats a parameter, includes multiple credentials, utilizes more than one mechanism for authenticating the client,<br/>or is otherwise malformed. |
| 400              | invalid_grant          | The provided authorization code is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.                                                                                                 |
| 400              | unsupported_grant_type | The authorization grant type is not supported by the authorization server.                                                                                                                                                                                           | 
| 401              | invalid_client         | Authenticated client id (%s) and session client value (%s) do not match                                                                                                                                                                                              |
| 401              | invalid_client         | Authenticated client id (%s) and authentication request client value (%s) do not match                                                                                                                                                                               |
