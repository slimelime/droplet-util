const JwtTokenVerifier = require('@myob/inbound-idam-auth');

const errors = require('./errors');
const {AuthenticationError} = errors;

async function verifyToken(idamPortal, idamToken, idamApplicationId) {
    const authoriser = new JwtTokenVerifier(idamPortal);

    try {
        return await authoriser.verifyToken(idamToken, idamApplicationId);
    } catch (err) {
        throw new AuthenticationError(`Validate IDAM token failed: ${err.message}`, errors.codes.Groups.Config, errors.codes.Config.Idam, errors.codes.Config.Token);
    }
}

module.exports = {
    verifyToken
};
