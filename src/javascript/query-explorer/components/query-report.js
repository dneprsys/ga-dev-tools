// Copyright 2015 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/* global gapi */


import assign from 'lodash/object/assign';
import DataChart from './data-chart';
import IconButton from '../../components/icon-button';
import isNull from 'lodash/lang/isNull';
import omit from 'lodash/object/omit';
import qs from 'querystring';
import queryParams from '../query-params';
import React from 'react';


const API_URI_BASE = 'https://www.googleapis.com/analytics/v3/data/ga?';


const SELF_BASE = location.protocol + '//' + location.host + location.pathname;


const TSV_PATH = SELF_BASE + 'csvhandler.csv';


let QueryReport = React.createClass({

  /**
   * Build a URL that directly links to this report
   * @return {string}
   */
  reportLink: function() {
    let params = (this.props.includeIds) ?
        this.props.report.params : omit(this.props.report.params, 'ids');
    return SELF_BASE + '?' + qs.stringify(queryParams.sanitize(params));
  },


  /**
   * Build a URL that can be used to query the Core Reporting API.
   * @return {string}
   */
  apiQueryUri: function() {
    let params = queryParams.sanitize(this.props.report.params);
    if (this.props.includeAccessToken) {
      params['access_token'] =
          gapi.analytics.auth.getAuthResponse().access_token;
    }
    return API_URI_BASE + qs.stringify(params);
  },


  /**
   * Build a URL that can download a TSV file for this report.
   * @return {string}
   */
  downloadTsvLink: function() {
    let params = queryParams.sanitize(this.props.report.params);
    params['access_token'] =
        gapi.analytics.auth.getAuthResponse().access_token;

    return TSV_PATH + '?' + qs.stringify(params);
  },


  render: function() {

    let partials = {};
    let report = this.props.report;
    let error = report && report.error;
    let accountData = report && report.accountData;
    let response = report && report.response;
    let params = report && report.params;

    if (accountData) {
      partials.reportTitle = (
        <h2 id="report-start" className="QueryReport-title">
          {accountData.property.name} ({accountData.view.name})
        </h2>
      )
    }

    if (error) {
      partials.reportError = (
        <aside className="Error">
          <h3 className="Error-title">
            Ack! There was an error ({error.code})
          </h3>
          <p className="Error-message">{error.message}</p>
        </aside>
      )
    }

    if (response) {
      let resultsShowing = response.dataTable.rows &&
          response.dataTable.rows.length || 0;
      let totalResults = response.totalResults || 0;
      let sampledData = response.containsSampledData ? 'Yes' : 'No'

      partials.reportMeta = (
        <aside className="QueryReport-meta">
          <ul className="InlineDefinitionList">
            <li className="InlineDefinitionList-item">
              <span className="InlineDefinitionList-itemName">
                Results showing:
              </span>
              <span className="InlineDefinitionList-itemValue">
                {resultsShowing}</span>
            </li>
            <li className="InlineDefinitionList-item">
              <span className="InlineDefinitionList-itemName">
                Total results found:</span>
              <span className="InlineDefinitionList-itemValue">
                {totalResults}</span>
            </li>
            <li className="InlineDefinitionList-item">
              <span className="InlineDefinitionList-itemName">
                Contains sampled data:</span>
              <span className="InlineDefinitionList-itemValue">
                {sampledData}</span>
            </li>
            <li className="InlineDefinitionList-item">
              <a
                href="#report-end"
                className="InlineDefinitionList-itemName A--normal">
                &#8595;&nbsp; Jump to bottom</a>
            </li>
          </ul>
        </aside>
      );

      partials.reportLink = (
        <div id="report-end" className="QueryReport-item">
          <p><a href="#report-start">&#8593;&nbsp; Return to top</a></p>
          <div className="FormControl FormControl--full">
            <label className="FormControl-label">
              Direct link to this Report</label>
            <div className="FormControl-body">
              <textarea
                rows="3"
                className="FormField"
                value={this.reportLink()}
                onFocus={this.props.onDirectLinkFocus}
                readOnly>
              </textarea>
              <label className="FormControl-info">
                <input
                  className="Checkbox"
                  type="checkbox"
                  onChange={this.props.onIdsToggle}
                  checked={this.props.includeIds} />
                  Include <code>ids</code> paramter in the link above
                  (uncheck if sharing publicly).
              </label>
            </div>
          </div>
        </div>
      );

      partials.reportQueryUri = (
        <div className="QueryReport-item">
          <div className="FormControl FormControl--full">
            <label className="FormControl-label">API Query URI</label>
            <div className="FormControl-body">
              <textarea
                rows="3"
                className="FormField"
                value={this.apiQueryUri()}
                onFocus={this.props.onApiUriFocus}
                readOnly>
              </textarea>
              <label className="FormControl-info">
                <input
                  className="Checkbox"
                  type="checkbox"
                  onChange={this.props.onAccessTokenToggle}
                  checked={this.props.includeAccessToken} />
                  Include current <code>access_token</code> in the Query URI
                  (will expire in ~60 minutes).
              </label>
            </div>
          </div>
        </div>
      );

      partials.reportDownloadLink = (
        <div className="QueryReport-item">
          <IconButton
            download
            type="file-download"
            href={this.downloadTsvLink()}
            className="Button Button--withIcon"
            onClick={this.props.onDownloadTsvClick}>
            Download Results as TSV
          </IconButton>
        </div>
      );
    }

    return (
      <div className="QueryReport" hidden={!response && !error}>
        {partials.reportTitle}
        {partials.reportError}
        {partials.reportMeta}
        <DataChart
          hidden={!response}
          className="QueryReport-item"
          params={params}
          isQuerying={this.props.isQuerying}
          onSuccess={this.props.onSuccess}
          onError={this.props.onError} />
        {partials.reportLink}
        {partials.reportQueryUri}
        {partials.reportDownloadLink}
      </div>
    );
  }
});


export default QueryReport
