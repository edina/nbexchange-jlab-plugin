import { JupyterFrontEnd } from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { PageConfig } from '@jupyterlab/coreutils';

import { HistoryList, CourseList } from './history';
// import { requestAPI } from '../handler';

export class HistoryWidget extends Widget {
  app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.app = app;

    this.node.innerHTML = [
      '  <h2 id="history_h2">NbExchange Interaction History</h2>',
      '  <div id="history-toolbar" class="row list_toolbar" >',
      '    <div class="col-sm-8 no-padding history-activity">',
      '      <p>This is a history of activity for <em>all</em> courses you have interacted with &mdash; according to the exchange service.</p>',
      '      <p>Submissions (only) can be downloaded from the history list:</p>',
      '      <ul>',
      '        <li>The "Download" button will download single submission into your home directory.</li>',
      '        <li>The "Collect" button (only available to instructors, and only on the current course) will do an NbGrader <samp>Collect</samp> operation, replacing whatever is already there.</li>',
      '      </ul>',
      '    </div>',
      '    <div class="col-sm-4 no-padding tree-buttons">',
      '      <span id="history_buttons" class="pull-right toolbar_buttons">',
      '        <button id="refresh_history_list" title="Refresh history list" class="btn btn-default btn-xs"><i class="fa fa-refresh"></i></button>',
      '      </span>',
      '    </div>',
      '  </div>',
      '  <div id="baautograde-alert-box" role="alert" class="alert alert-danger version_error">',
      '  </div>',
      '  <div class="panel-group" id="actions-panel-group">',
      '  </div>'
    ].join('\n');
    this.node.style.overflowY = 'auto';

    const base_url = PageConfig.getBaseUrl();
    const options = new Map();
    options.set('base_url', base_url);
    const history_l = new HistoryList(this, 'actions-panel-group');

    new CourseList(this, 'refresh_history_list', history_l, options);
  }
}
