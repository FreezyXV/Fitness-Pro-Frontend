import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], filter: { [key: string]: any }): any {
    if (!items || !filter) {
      return items;
    }
    return items.filter(item => {
      let match = true;
      for (const key in filter) {
        if (filter.hasOwnProperty(key)) {
          if (item[key] !== filter[key]) {
            match = false;
            break;
          }
        }
      }
      return match;
    });
  }
}
