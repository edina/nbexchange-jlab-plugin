import { Token } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ISignal, Signal } from '@lumino/signaling';

import { getFeatureStatus } from './handler';

export interface IFeatureStatus {
  historyEnabled: boolean;
  bulkAutogradeEnabled: boolean;
  isReady: boolean;
  refresh(): Promise<void>;
  historyEnabledChanged: ISignal<IFeatureStatus, boolean>;
  bulkAutogradeEnabledChanged: ISignal<IFeatureStatus, boolean>;
}

export const IFeatureStatus = new Token<IFeatureStatus>(
  '@jupyter/nbexchange:IFeatureStatus'
);

export class FeatureStatusService implements IFeatureStatus, IDisposable {
  private _historyEnabled = false;
  private _bulkAutogradeEnabled = false;
  private _isReady = false;
  private _disposed = false;

  private _historyEnabledChanged = new Signal<IFeatureStatus, boolean>(this);
  private _bulkAutogradeEnabledChanged = new Signal<IFeatureStatus, boolean>(
    this
  );

  get historyEnabled(): boolean {
    return this._historyEnabled;
  }

  get bulkAutogradeEnabled(): boolean {
    return this._bulkAutogradeEnabled;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  get historyEnabledChanged(): ISignal<IFeatureStatus, boolean> {
    return this._historyEnabledChanged;
  }

  get bulkAutogradeEnabledChanged(): ISignal<IFeatureStatus, boolean> {
    return this._bulkAutogradeEnabledChanged;
  }

  async refresh(): Promise<void> {
    try {
      const status = await getFeatureStatus();
      const oldHistory = this._historyEnabled;
      const oldBulkAutograde = this._bulkAutogradeEnabled;

      this._historyEnabled = status.history;
      this._bulkAutogradeEnabled = status.bulk_autograde;
      this._isReady = true;

      if (oldHistory !== this._historyEnabled) {
        this._historyEnabledChanged.emit(this._historyEnabled);
      }
      if (oldBulkAutograde !== this._bulkAutogradeEnabled) {
        this._bulkAutogradeEnabledChanged.emit(this._bulkAutogradeEnabled);
      }
    } catch (error) {
      console.error('Failed to fetch feature status:', error);
      this._isReady = true;
    }
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    Signal.clearData(this);
  }

  get isDisposed(): boolean {
    return this._disposed;
  }
}
