/* eslint-disable new-cap */
jest.disableAutomock();
jest.mock('@myob/inbound-idam-auth');

const JwtTokenVerifier = require('@myob/inbound-idam-auth');
const verifyTokenFn = jest.fn();
JwtTokenVerifier.mockImplementation(() => {
    return {
        verifyToken: verifyTokenFn
    };
});

const idamTokenValidator = require('./idam-token-validator');
const idamPortal = 'https://sit.login.myob.com/.well-known/openid-configuration';
const idamToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IktiMTlTbHlnSXJsLU5STFpDd0daVS03VVp1TSIsInR0eSI6ImFjY2Vzc190b2tlbiJ9.eyJpc3MiOiJodHRwczovL3NpdC5sb2dpbi5teW9iLmNvbS8iLCJzdWIiOiJkcm9wbGV0LXNpdCIsImF1ZCI6IjI1OTY0ZjEwLWFjMmMtNDQyNS1iYzY2LWQ3NmNhZmYyMzg5OSIsImV4cCI6MTUxMDEwOTUxMCwibmJmIjoxNTEwMTA1OTEwLCJpYXQiOjE1MTAxMDU5MTAsImp0aSI6IjJiZDAyNWNiLTk2NGItNDU3Ni05YzFlLTI2ZGUzY2IwMDc1ZiIsImNsaWVudF9pZCI6ImRyb3BsZXQtc2l0Iiwic2NwIjoic2VydmljZS5hY2Nlc3Mgc2VydmljZS5jcmVhdGUifQ.OtOxW0NmfLm8xO5QJuaUApgNqxcoGTM6xJSozTQvf5CZKVXuST4rdpmn9ru03nzuRGTCD2L14YZxeyqEjOLcE3x3OuKGvVQFSqafXW52AA-g28jqChs1GorhhCE_c-WNIrjeWeHBixPUGZ97P2T_BX_uOWv8gfzgzxqDZnf3Fng8YuxNLEnWfj4iBdcsjuuOPGPdBNFA_LbTcr0DhvuBrGZTMCq2yCW8ZmtwBEWO19NR5-h4URPxvTTk_Znu5jHXKWNrs2BjuLzn23CTCBF_NAnEpQM6gRz2r8seKvNSGPzMDxhC05aLD-3_cJU62O02FpzXkHWgJd4FnOXmlrHzbQ';
const idamApplicationId = '25964f10-ac2c-4425-bc66-d76caff23899';

describe('idam-token-validator', () => {

    const clearMocks = () => {
        verifyTokenFn.mockClear();
    };

    describe('When the token is validated successfully', () => {
        const tokenDetail = {
            iss: 'https://sit.login.myob.com/',
            sub: 'droplet-sit',
            aud: '25964f10-ac2c-4425-bc66-d76caff23899',
            exp: 1510109510,
            nbf: 1510105910,
            iat: 1510105910,
            jti: '2bd025cb-964b-4576-9c1e-26de3cb0075f',
            client_id: 'droplet-sit',
            scp: 'service.access service.create'
        };

        beforeEach(() => {
            clearMocks();
            verifyTokenFn.mockReturnValueOnce(Promise.resolve(tokenDetail));
        });

        it('initiates idam token varifier with idam portal', async () => {
            await idamTokenValidator.verifyToken(idamPortal, idamToken, idamApplicationId);
            expect(JwtTokenVerifier).toBeCalledWith(idamPortal);
        });

        it('validates IDAM token', async () => {
            await idamTokenValidator.verifyToken(idamPortal, idamToken, idamApplicationId);
            expect(verifyTokenFn).toBeCalledWith(idamToken, idamApplicationId);
        });

        it('returns token detail', async () => {
            expect(await idamTokenValidator.verifyToken(idamPortal, idamToken, idamApplicationId)).toEqual(tokenDetail);
        });
    });

    describe('When the token failed to be validated', () => {
        const rejectDetail = {
            scp: 'deny',
            message: 'jwt expired'
        };

        beforeEach(() => {
            clearMocks();
            verifyTokenFn.mockReturnValueOnce(Promise.reject(rejectDetail));
        });

        it('throws UnretryableError', async () => {
            try {
                await idamTokenValidator.verifyToken(idamPortal, idamToken, idamApplicationId);
            } catch (err) {
                console.log(err);
                expect(err.name).toEqual('AuthenticationError');
            }
        });
    });
});
