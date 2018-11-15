
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import { Component, forwardRef } from '@angular/core';
import { AbstractControl, ValidatorFn, NG_VALIDATORS } from '@angular/forms';

@Component ({
  selector: 'validatePort',
  template:'',
  providers: [{provide: NG_VALIDATORS, useExisting: forwardRef(() => PortValidator), multi: true}]
})

export class PortValidator {

  static range(min: number, max: number): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      let trimmed = c.value.trim();
      let val = +(trimmed);
      if (trimmed == null) {
        return { 'required': true};
      }
      if (val === val) {
        if (val<min || val>max) {
          return { 'range': true };
        } else {
          return null;
        }
      }
      if (trimmed.length>0) {
        return {'type': true};
      }
      return null;
    }
  }
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
