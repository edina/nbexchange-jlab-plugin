import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { HistoryWidget } from './index';
import { commandIDs } from '../index';

const HISTORY_PLUGIN_ID = '@jupyter/nbexchange:history';

export const historyPlugin: JupyterFrontEndPlugin<void> = {
  id: HISTORY_PLUGIN_ID,
  description:
    'Exchange History: View all actions in an out of the exchange, by course and assignment.',
  autoStart: true,
  optional: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette | null) => {
    const historyWidget = new HistoryWidget(app);
    const main = new MainAreaWidget({ content: historyWidget });

    main.id = 'nbexchange-history';
    main.title.label = 'Exchange History';
    main.title.closable = true;

    const command = commandIDs.openHistory;
    app.commands.addCommand(command, {
      label: 'Exchange History',
      execute: () => {
        if (!main.isAttached) {
          app.shell.add(main, 'main');
        }
        app.shell.activateById(main.id);
      }
    });

    if (palette) {
      palette.addItem({
        command: command,
        category: 'NbExchange'
      });
    }
  }
};

export default historyPlugin;
