import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'


const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-iuvzn7az.auth0.com/.well-known/jwks.json'
let jwks = null;
//const url = 'http://samples.openweathermap.org/data/2.5/forecast?id=524901&appid=b6907d289e10d714a6e88b30761fae22';


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized' + jwks, jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}
//
async function verifyToken(authHeader: string): Promise<JwtPayload> {
  logger.info('verifytoken function start');
  await fetchJWKS()
  
  const token = getToken(authHeader)
  logger.info('const token: '+ token);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  logger.info('const jwt decoded: ' + JSON.stringify(jwt.header));

  const { header } = jwt;

  if ( !header || header.alg !== 'RS256' ) {
    throw new Error( 'Token is not RS256 encoded' );
  }
  logger.info('jwks: ' + JSON.stringify(jwks));
  const key = getJWKSSigningKey( header.kid );
  const actualKey = key.publicKey || key.rsaPublicKey;


  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

        
        return verify(token, actualKey, { algorithms: ['RS256'] })as JwtPayload

    
}

function certToPEM( cert ) {
  let pem = cert.match( /.{1,64}/g ).join( '\n' );
  pem = `-----BEGIN CERTIFICATE-----\n${ cert }\n-----END CERTIFICATE-----\n`;
  return pem;
}
 async function fetchJWKS(){
  logger.info('fetchJWKS function start ');
  let axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': true,
    }
  };

  let response = await axios.get(jwksUrl, axiosConfig)//.then(response => {})
    logger.info('Axiom call:' + JSON.stringify(response.data.keys));
    let jwksString: string = JSON.stringify(response.data.keys);
    jwks = JSON.parse(jwksString);
  
  // .then(function (response) {
  //   logger.info('Axiom call:', response.data.keys);
  //   return response.data.keys
  // })
  // .catch(error => {
  //   logger.error(error);
  //   throw new Error('Invalid JWKS')
  // })
  // .catch(function (error) {
  //   console.log(error);
  //   throw new Error('Invalid JWKS')
  // });
 }

function getJWKSSigningKeys() {
  return jwks
    .filter(
      ( key ) =>
        key.use === 'sig' && // JWK property `use` determines the JWK is for signing
        key.kty === 'RSA' && // We are only supporting RSA (RS256)
        key.kid && // The `kid` must be present to be useful for later
        ( ( key.x5c && key.x5c.length ) || ( key.n && key.e ) ) // Has useful public keys
    )
    .map( ( key ) => ( { kid: key.kid, nbf: key.nbf, publicKey: certToPEM( key.x5c[ 0 ] ) } ) );
}

function getJWKSSigningKey( kid ) {
  return getJWKSSigningKeys().find( ( key ) => key.kid === kid );
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}