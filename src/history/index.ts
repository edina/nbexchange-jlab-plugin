import {JupyterFrontEnd} from '@jupyterlab/application';

import {Widget} from '@lumino/widgets';

import {PageConfig} from '@jupyterlab/coreutils';

import {
    HistoryList,
    CourseList,
} from './history';
import {requestAPI} from "../handler";

export class HistoryWidget extends Widget {

    app: JupyterFrontEnd;

    constructor(app: JupyterFrontEnd) {
        super();
        this.app = app;

        this.node.innerHTML = ([
            '<div id="nbexchange-history-list" class="tab-pane">',
            '  <div id="history_toolbar" class="row list_toolbar">',
            '    <div class="col-sm-8 no-padding">',
            '      <span id="history_list_info" class="toolbar_info">History for course:</span>',
            '      <div class="btn-group btn-group-xs">',
            '        <button type="button" class="btn btn-default" id="course_list_default">Loading, please wait...</button>',
            '        <button type="button" class="btn btn-default dropdown-toggle" id="course_list_dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled="disabled">',
            '          <span class="caret"></span>',
            '          <span class="sr-only">Toggle Dropdown</span>',
            '        </button>',
            '        <ul class="dropdown-menu" id="course_list">',
            '        </ul>',
            '      </div>',
            '    </div>',
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
            '</div>',
        ].join('\n'));
        this.node.style.overflowY = 'auto';

        let base_url = PageConfig.getBaseUrl();
        let options = new Map();
        options.set('base_url',base_url);
        const history_l = new HistoryList(
            this,
            'actions-panel-group'
        );
        new CourseList(this,
            'course_list',
            'course_list_default',
            'course_list_dropdown',
            'refresh_history_list',
            history_l,
            options
        );

        this.checkNbGraderVersion();
    }

    checkNbGraderVersion() {
        const warning = this.node.getElementsByClassName('version_error')[0] as HTMLDivElement;
        requestAPI<any>('nbgrader_version?version='+"0.9.5", '')
            .then(response => {
                if (!response['success']) {
                    warning.hidden=false;
                    warning.innerText = response['message'];
                    warning.style.display = 'block'
                }
                else {
                    warning.hidden=true;
                }
            })
            .catch(reason => {
                console.error(
                    `Error on GET /assignment_list/nbgrader_version.\n${reason}`
                );
            });
    }

}