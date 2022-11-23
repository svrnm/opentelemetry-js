/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '../../Resource';
import { Detector, ResourceAttributes } from '../../types';
import { ResourceDetectionConfig } from '../../config';
import { arch, hostname } from 'os';
import { promisify } from 'util';
import { readFile } from 'fs';
import { diag } from '@opentelemetry/api';

/**
 * HostDetector detects the resources related to the host current process is
 * running on. Currently only non-cloud-based attributes are included.
 */
export class HostDetector implements Detector {
  // See https://wiki.debian.org/MachineId for details on those
  // 2 file path candidates
  readonly MACHINE_ID_FILE_PATH_1 = '/etc/machine-id';
  readonly MACHINE_ID_FILE_PATH_2 = '/var/lib/dbus/machine-id';
  readonly UTF8_UNICODE = 'utf8';

  private static readFileAsync = promisify(readFile);

  async detect(_config?: ResourceDetectionConfig): Promise<Resource> {
    const attributes: ResourceAttributes = {
      [SemanticResourceAttributes.HOST_NAME]: hostname(),
      [SemanticResourceAttributes.HOST_ARCH]: this._normalizeArch(arch()),
    };
    const hostId = await this._getHostId();
    if (hostId) {
      attributes[SemanticResourceAttributes.HOST_ID] = hostId;
    }
    return new Resource(attributes);
  }

  private async _getMachineIdFromFile(file: string) {
    try {
      return await HostDetector.readFileAsync(file, this.UTF8_UNICODE);
    } catch (e) {
      return '';
    }
  }

  private async _getHostId() {
    try {
      // Many linux systems have a machine-id file that is created on first boot
      // and stays stable afterwards.
      // https://www.freedesktop.org/software/systemd/man/machine-id.html
      return (
        (await this._getMachineIdFromFile(this.MACHINE_ID_FILE_PATH_1)) ||
        (await this._getMachineIdFromFile(this.MACHINE_ID_FILE_PATH_2))
      );
    } catch (e) {
      diag.debug(
        'Host ID did not identify a supported environment, no host.id will be set'
      );
      return '';
    }
  }

  private _normalizeArch(nodeArchString: string): string {
    // Maps from https://nodejs.org/api/os.html#osarch to arch values in spec:
    // https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/resource/semantic_conventions/host.md
    switch (nodeArchString) {
      case 'arm':
        return 'arm32';
      case 'ppc':
        return 'ppc32';
      case 'x64':
        return 'amd64';
      default:
        return nodeArchString;
    }
  }
}

export const hostDetector = new HostDetector();
