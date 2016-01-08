var ccb = require('../lib/ccb');
var should = require('should');
var fs = require('fs');
var assert = require('assert');
var JiraApi = require('jira').JiraApi;

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

describe('when executing ccb', function() {
  // README: Add your jira username and password to grunt test as environment variables.
  // e.g.
  // JIRA_USERNAME=myusername JIRA_PASSWORD=mypassword grunt test
  it('has valid jira credentials env variables', function() {
    assert.equal(
      typeof process.env.JIRA_USERNAME,
      'string',
      'must provide a jira username'
    );
    assert.equal(
      typeof process.env.JIRA_PASSWORD,
      'string',
      'must provide a jira password'
    );
  });

  describe('with valid jira credentials', function() {
    this.timeout(10000);

    var result;
    var jiraConfig = {
      protocol: 'https',
      host: 'opentable.atlassian.net',
      port: 443,
      username: process.env.JIRA_USERNAME,
      password: process.env.JIRA_PASSWORD,
      verbose: true,
      version: '2',
      // README: this project id belongs to the integration test project
      // https://opentable.atlassian.net/projects/INTT/issues/
      project_id: '19200',
      ccb_issue_type: '1',
      ccb_done_state: '11',
      proxy: ''
    };

    var jira = new JiraApi(
      jiraConfig.protocol,
      jiraConfig.host,
      jiraConfig.port,
      jiraConfig.user,
      jiraConfig.password,
      jiraConfig.version,
      jiraConfig.verbose,
      jiraConfig.strictSSL
    );

    before(function(done) {
      ccb({
        jira: jiraConfig,
        project: {
          name: 'Search API v2 (node)',
          custom_text: 'Search API v2 Manifest Step',
          description: 'Search API v2 Manifest Step'
        },
        manifest: process.cwd() + '/tests/data/manifest.json',
        build_number: 'v0.0.350'
      })
      .then(function(res) {
        result = JSON.parse(res);
        done();
      })
      .catch(function(err) {
        console.log('\n README: If you see an authentication error, you may need to add your credentials as environment variables. \n');
        done(err);
      })
      .done();
    });

    it('responds with a valid issue', function() {
      assert.ok(result instanceof Array);
      assert.equal(result[0].filename, 'manifest.json');
    });
  });
});

// FIXME:  these tests fail because tests/data/actual/ccb-request.json is empty
describe.skip('issuing the create ccb request', function(){
    var actual, expected;

    before(function() {
      actual = JSON.parse(fs.readFileSync('tests/data/actual/ccb-request.json'));
      expected = JSON.parse(fs.readFileSync('tests/data/expected/ccb-request.json'));
    });

    it('should set the host correctly', function(){
        actual.headers.host.should.be.equal(expected.headers.host);
    });

    it('should set authorization header correctly', function(){
        actual.headers.authorization.should.be.equal(expected.headers.authorization);
    });

    it('should set url correctly', function(){
        actual.url.should.be.equal(expected.url);
    });

    it('should send the correct body', function(){

        // removing the date field, as this cannot be included in a direct compare
        var actual_no_dates = JSON.parse(fs.readFileSync('tests/data/actual/ccb-request.json'));
        var expected_no_dates = JSON.parse(fs.readFileSync('tests/data/expected/ccb-request.json'));
        actual_no_dates.body.fields.customfield_11502 = null;
        expected_no_dates.body.fields.customfield_11502 = null;

        actual_no_dates.body.should.be.eql(expected_no_dates.body);
    });

    it('should have the correct date in the body', function(){
        var actual_date = new Date(actual.body.fields.customfield_11502);
        var one_minute_in_the_past = new Date().getTime() - 60000;
        actual_date.getTime().should.be.above(one_minute_in_the_past)
    });
});

describe.skip('issuing the transition ticket to done request', function(){
    var actual, expected;

    before(function(){
      actual = JSON.parse(fs.readFileSync('tests/data/actual/done-transition-request.json'));
      expected = JSON.parse(fs.readFileSync('tests/data/expected/done-transition-request.json'));
    });

    it('should set the host correctly', function(){
        actual.headers.host.should.be.equal(expected.headers.host);
    });

    it('should set authorization header correctly', function(){
        actual.headers.authorization.should.be.equal(expected.headers.authorization);
    });

    it('should set url correctly', function(){
        actual.url.should.be.equal(expected.url);
    });

    it('should send the correct body', function(){
        actual.body.should.be.eql(expected.body);
    });
});
