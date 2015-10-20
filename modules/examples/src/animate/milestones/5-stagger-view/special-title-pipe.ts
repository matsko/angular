import {Pipe, PipeTransform, Injectable} from 'angular2/angular2';

@Pipe({name: 'specialTitle'})
@Injectable()
export class SpecialTitlePipe implements PipeTransform {
  transform(value: any, args: any[] = null): string {
    return value[0].toUpperCase();
  }
}

