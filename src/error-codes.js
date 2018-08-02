// Code Families
const S3 = 'S3';
const Limit = 'Limit';
const Config = 'Config';
const Execution = 'Execution';
const Redshift = 'Redshift';
const Iam = 'Iam';
const Sfmc = 'SFMC';

// REASON GROUPS
// limits
const Continuation = 'Continuation';
const Quota = 'Quota';
const Timeout = 'Timeout';
// Config
const Environment = 'Environment';
const Variables = 'Variables';
const $Object = 'Object';
const Properties = 'Properties';
const Idam = 'Idam';
const Token = 'Token';
// batch files/objects
const NoSuchKey = 'NoSuchKey';
const Format = 'Format';
const Header = 'Header';
const Load = 'Load';
const Unload = 'Unload';
// command execution
const Arguments = 'Arguments';
const Parameters = 'Parameters';
const Version = 'Version';
// Permission
const AssumeRole = 'AssumeRole';

// SFMC
const NotAuthorized = 'NotAuthorized';
const Unauthorized = 'Unauthorized';
const UnknownEventDefinitionKey = 'UnknownEventDefinitionKey';
const DuplicateEventData = 'DuplicateEventData';
const SfmcDefaultError = 'SfmcDefaultError';

module.exports = {
    Groups: {
        S3, Limit, Config, Execution, Redshift, Iam, Sfmc
    },
    S3: {Format, Header, NoSuchKey},
    Limit: {Continuation, Quota, Timeout},
    Config: {Environment, Variables, Version, Idam, Token, $Object, Properties},
    Execution: {Arguments, Parameters, Version},
    Redshift: {Load, Format, Unload},
    Iam: {AssumeRole},
    Sfmc: { NotAuthorized, Unauthorized, DuplicateEventData, UnknownEventDefinitionKey, SfmcDefaultError }
};
