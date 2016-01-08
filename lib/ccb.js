'use strict';

var JiraApi = require('jira').JiraApi;
var q = require('q');
var util = require('util');
var fs = require('fs');
var request = require('request');

module.exports = function ccb(args) {
  var logger = args.logger || console.log.bind(console);

  logger('Options::', args);

  var config = {
    protocol: args.jira.protocol || 'https',
    host: args.jira.host || args.jira.api_url,
    port: args.jira.port || 443,
    user: args.jira.username || args.jira.user,
    password: args.jira.password || args.jira.pass,
    version: args.jira.version || '2',
    verbose: args.jira.verbose || true,
    strictSSL: args.jira.strictSSL || false,
    description: args.project.description || '',
    environment: args.environment || 'production',
    issuetype_id: args.jira.ccb_issue_type || '3',
    logger: logger
  };

  logger('Config', config);

  var jira = new JiraApi(
    config.protocol,
    config.host,
    config.port,
    config.user,
    config.password,
    config.version,
    config.verbose,
    config.strictSSL
  );

  logger("Creating CCB");

  var issueOptions = {
    fields: {
      project: {
        id: args.jira.project_id
      },
      summary: util.format('Deploying %s %s to production', args.project.name, args.build_number),
      issuetype: {
        id: config.issuetype_id
      }
    }
  };

  logger('issueOptions', JSON.stringify(issueOptions));

  function attachDocument(issueId) {
    var options = {
      uri: 'https://opentable.atlassian.net/rest/api/2/issue/' + issueId + '/attachments',
      method: 'POST',
      auth: {
        user: config.user,
        pass: config.password
      },
      formData: {
        file: fs.createReadStream(args.manifest)
      },
      headers: {
        'X-Atlassian-Token': 'no-check',
        'content-type': 'multipart/form-data'
      }
    };

    return q.promise(function(resolve, reject) {
      request(options, function(err, res) {
        if (err) {
          reject(err);
        } else {
          if (res.statusCode === 200) {
            resolve(res.body);
          } else {
            reject(res.body);
          }
        }
      });
    });
  }

  var addNewIssue = q.promise(function(resolve, reject) {
    jira.addNewIssue(issueOptions, function(err, response) {
      if (err) {
        reject(errorObj);
      } else {
        resolve(response);
      }
    });
  });

  return addNewIssue
    .then(function(result) {
      logger('Issue: ', result);
      return attachDocument(result.id);
    })
    .then(function(result) {
      logger('Attachment: ', result);
      return result;
    })
    .catch(function(err) {
      var errorObj =
        err instanceof Error ?
          err :
          new Error(JSON.stringify(err));

      logger("err", errorObj.message);
      throw errorObj;
    });
};
