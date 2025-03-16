# OTHub API

OTHub API is a community managed NodeJS App Interface to provide access to indexed OriginTrail Parachain data synchronized by using the [otp-sync](https://github.com/othub-io/otp-sync) repository.

### OTHub API:
- Provides free rate access to anyone who connects a wallet and generates an API key;
- Allows app developers to develop their own DKG tools that provide great value to the community;
- Provides netowrk data as well as the ability to get and queue publishes

### Timeline
- Q3 2023 - Add additional data streams as more otp-sync tables are finalized
- Q4 2023 - Improve on access to variety of data
- Q1 2024 - Improve filter capabilites of requests
- Q2 2024 - Add ability to perform get via othub-api as well as queue publishes/updateS to be signed on [OTHub](othub.io) hosted by othub-react
- Q3 2024 - Improved rates if demand requires

### Expected Impact
OTHub API is how the OTHub team will attempt to kick start the DKG tooling app development race. The OTHub API can be the first of many independently hosted APIs that provide future app developers of the DKG with the data they need. We hope open sourcing our api encourages others to bring up their own instance.

### Instructions
> **Warning**
> 
> OTHub API is NOT a replacement for OTHub Runtime. You must have the OriginTrail Parachain fully synchronized with the otp-sync repoitory before this API will return accurate results.

Set up your working environment
```
git clone https://github.com/othub-io/othub-api
cd othub-api
cp .example-env .env
npm install
```
Below is the list of essential parameters:

| Params            | Description                                |
|-------------------|-------------------------------------------|
| PORT              | The port the API will be available on. |
| SSL_KEY_PATH             | The Private Key path for SSL.                            |
| SSL_CRT_PATH           | The certificate path for SSL.                              |
| OT_NODE_HOSTNAME       | The IP:PORT or DNS name for the otnode service.                 |
| OT_NODE_PORT            | The port for the otnode service.             |
| DBHOST            | The IP or DNS name of the mySQL DB instance sync'd with otp-sync             |
| USER              | Username for accessing the mySQL database         |
| PASSWORD          | Password for accessing the mySQL database         |
| GOD_KEY            | The key string that by passes all API restrictions.            |
| OTHUB_DB          | OTHub database name (non-sync data)                          |
| SYNC_DB           | Sync database, refer to [otp-sync](https://github.com/othub-io/otp-sync) for details               |

Copy the service file and start the api
```
cp ~/othub-bot/othub-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl start othub-api
systemctl enable othub-api
```

API Documentation:
[othub-api postman documentation](https://www.postman.com/crimson-crescent-721757/workspace/othub-api)
```
