import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: "gridify"
})
export class GridifyPipe implements PipeTransform {
  constructor() {
  }

  public transform(originalArray: Array<any>, rowSize: number): Array<any> {
    const gridifiedArray: Array<any> = [];
    let temporaryArray: Array<any> = [];

    originalArray.forEach(
      (originalArrayElement: any, index: number): void => {
        if ((index + 1) % rowSize !== 0) {
          temporaryArray.push(originalArrayElement);
        } else {
          gridifiedArray.push(temporaryArray.concat(originalArrayElement));
          temporaryArray = [];
        }
      }
    );

    if (temporaryArray.length > 0) {
      gridifiedArray.push(temporaryArray);
    }

    return gridifiedArray;
  }
}
