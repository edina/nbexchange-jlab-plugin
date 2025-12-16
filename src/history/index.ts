import { JupyterFrontEnd } from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { PageConfig } from '@jupyterlab/coreutils';

import { HistoryList, CourseList } from './history';
import { requestAPI } from '../handler';

export class HistoryWidget extends Widget {
  app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;

    this.node.innerHTML = [
      '<div id="nbexchange-history-list" class="tab-pane">',
      '  <p>This is a history of activity for <em>all</em> courses you have interacted with &mdash; according to the exchange service.</p>',
      '  <div id="history-toolbar" class="row list_toolbar" >',
      '    <div class="col-sm-8 no-padding"> <!-- -->',
      '      <span id="history_list_info" class="toolbar_info">Current course:</span>',
      '      <div class="btn-group btn-group-xs">',
      '        <button type="button" class="btn btn-default" id="course_list_default">Loading, please wait...</button>',
      '        <button type="button" id="course_list_dropdown">',
      '        </button>',
      '        <ul class="dropdown-menu" id="course_list">',
      '        </ul>',
      '      </div>',
      '    </div> <!-- -->',
      '    <div class="col-sm-4 no-padding tree-buttons">',
      '      <span id="history_buttons" class="pull-right toolbar_buttons">',
      '      <button id="refresh_history_list" title="Refresh history list" class="btn btn-default btn-xs"><i class="fa fa-refresh"></i></button>',
      '      </span>',
      '    </div>',
      '  </div>',
      '  <div class="alert alert-danger version_error">',
      '  </div>',
      '  <div class="panel-group" id="actions-panel-group">',
      '  </div>',
      '</div>'
    ].join('\n');
    this.node.style.overflowY = 'auto';

    const base_url = PageConfig.getBaseUrl();
    const options = new Map();
    options.set('base_url', base_url);
    const history_l = new HistoryList(this, 'actions-panel-group');

    new CourseList(
      this,
      'course_list',
      'course_list_dropdown',
      'refresh_history_list',
      history_l,
      options
    );

    this.checkNbGraderVersion();
  }

  checkNbGraderVersion() {
    const warning = this.node.getElementsByClassName(
      'version_error'
    )[0] as HTMLDivElement;
    requestAPI<any>('nbgrader_version?version=' + '0.9.5', '')
      .then(response => {
        if (!response['success']) {
          warning.hidden = false;
          warning.innerText = response['message'];
          warning.style.display = 'block';
        } else {
          warning.hidden = true;
        }
      })
      .catch(reason => {
        console.error(
          `Error on GET /assignment_list/nbgrader_version.\n${reason}`
        );
      });
  }
}
