declare module 'auth0' {
    export class AuthenticationClient {
      constructor(options: {
        domain: string;
        clientId: string;
        clientSecret: string;
      });
  
      oauth: {
        authorizationCodeGrant(options: {
          code: string;
          redirect_uri: string;
        }): Promise<{
          access_token: string;
          id_token: string;
          refresh_token: string;
          token_type: string;
          expires_in: number;
        }>;
      };
  
      getProfile(accessToken: string): Promise<{
        user_id?: string;
        sub?: string;
        nickname?: string;
        name?: string;
        picture?: string;
        email?: string;
        [key: string]: any;
      }>;
    }
  
    export class ManagementClient {
      constructor(options: {
        domain: string;
        clientId: string;
        clientSecret: string;
        audience: string;
      });
  
      getUser(params: { id: string }): Promise<any>;
      getUsers(params?: { q?: string; page?: number; per_page?: number }): Promise<any[]>;
    }
  }