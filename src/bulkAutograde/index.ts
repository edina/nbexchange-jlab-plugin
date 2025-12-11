import { JupyterFrontEnd } from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { PageConfig } from '@jupyterlab/coreutils';

import { BaAssignmentsList, AssignmentsList } from './bulkAutograde';
// import { HistoryList, CourseList } from './history';

export class BulkAutogradeWidget extends Widget {
  app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;

    this.node.innerHTML = [
      '<section id="bulkautograder" class="tab-pane" aria-label="NBExchange bulk autograder page">',
      '  <p>Select the list of Assignments to be autograded.</p>',
      '  <div id="assignments-toolbar" class="row list_toolbar">',
      '    <div class="col-sm-8 no-padding"> <!-- -->',
      '      <div>',
      '        <button type="button" class="btn btn-default" id="assignment_list_default">Loading, please wait...</button>',
      '        <table id="assignment-table" border="0">',
      '        </table>',
      '      </div>',
      '    </div> <!-- -->',
      '    <div class="col-sm-4 no-padding tree-buttons">',
      '      <span id="history_buttons" class="pull-right toolbar_buttons">',
      '      <button id="refresh_assignment_list" title="Refresh history list" class="btn btn-default btn-xs"><i class="fa fa-refresh"></i></button>',
      '      </span>',
      '    </div>',
      '  </div>',
      '  <div id="baautograde-alert-box" role="alert" class="alert alert-danger version_error">',
      '  </div>',
      '  <div class="panel-group" id="results-panel-group">',
      '  <div>',
      '</section>'
    ].join('\n');
    this.node.style.overflowY = 'auto';

    const base_url = PageConfig.getBaseUrl();
    const options = new Map();
    options.set('base_url', base_url);
    const assignments = new BaAssignmentsList(this, 'results-panel-group');

    new AssignmentsList(
      this,
      'assignment-table', // id for element to put assignments into
      'assignment_list_default', // the "loading..." message
      'refresh_assignment_list', // refresh the page
      assignments, // big list of assignments for the course
      options
    );

    // this.checkNbGraderVersion();
  }
}
