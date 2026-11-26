import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { HistoryWidget } from './index';
import { commandIDs } from '../index';
import { IFeatureStatus } from '../featureStatus';

const HISTORY_PLUGIN_ID = '@jupyter/nbexchange:history';

export const historyPlugin: JupyterFrontEndPlugin<void> = {
  id: HISTORY_PLUGIN_ID,
  description:
    'Exchange History: View all actions in an out of the exchange, by course and assignment.',
  autoStart: true,
  requires: [IFeatureStatus],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    featureStatus: IFeatureStatus,
    palette: ICommandPalette | null
  ) => {
    let main: MainAreaWidget<HistoryWidget> | null = null;

    const command = commandIDs.openHistory;
    app.commands.addCommand(command, {
      label: 'Exchange History',
      execute: () => {
        // Create new widget if none exists, or if the current one is disposed
        if (!main || main.isDisposed) {
          const historyWidget = new HistoryWidget(app);
          main = new MainAreaWidget({ content: historyWidget });
          main.id = 'nbexchange-history';
          main.title.label = 'Exchange History';
          main.title.closable = true;
        }

        if (!main.isAttached) {
          app.shell.add(main, 'main');
        }
        app.shell.activateById(main.id);
      },
      isEnabled: () => featureStatus.isReady && featureStatus.historyEnabled
    });

    if (palette) {
      palette.addItem({
        command: command,
        category: 'NbExchange'
      });
    }

    featureStatus.historyEnabledChanged.connect(() => {
      app.commands.notifyCommandChanged(command);
    });
  }
};

export default historyPlugin;
