import {Injectable} from 'angular2/angular2';

@Injectable()
export class DbService {
  users() {
    return [{
      id:0,
      name:"Jaquan Kiehn",
      age:17,
      email:"harmony@ko.biz",
      location:"Terenceland Oklahoma Central African Republic"
    },{
      id:1,
      name:"Jedidiah Walker",
      age:53,
      email:"river.rogahn@spinka.org",
      location:"Lemkeborough California Gibraltar"
    },{
      id:2,
      name:"Kory Bergnaum",
      age:39,
      email:"fabian.maggio@gorczany.biz",
      location:"Port Icieton Wisconsin Tunisia"
    },{
      id:3,
      name:"Alexandria Hettinger",
      age:57,
      email:"elbert.skiles@abbottbahringer.info",
      location:"New Daijaport Idaho Argentina"
    },{
      id:4,
      name:"Miss Kamren Mante",
      age:58,
      email:"israel_gusikowski@maggio.biz_Kemmerstad",
      location:"Wyoming Virgin Islands U.S."
    },{
      id:5,
      name:"Thomas Johnston",
      age:97,
      email:"davonte@williamson.com",
      location:"South Krystina Nebraska Palestinian Territory"
    },{
      id:6,
      name:"Brigitte Kerluke",
      age:66,
      email:"sidneyconnelly@erdman.org",
      location:"New Lauraton Kentucky Uruguay"
    },{
      id:7,
      name:"Yvette Mayer",
      age:37,
      email:"juwan@dietrichblick.com",
      location:"Hermistonbury Iowa Greenland"
    },{
      id:8,
      name:"Vladimir Tremblay",
      age:38,
      email:"sally.reynolds@turcotte.org",
      location:"Port Darienbury Mississippi Liechtenstein"
    },{
      id:9,
      name:"Deangelo Donnelly",
      age:68,
      email:"glennie@nicolasebert.biz",
      location:"Yasmineberg Texas Monaco"
    },{
      id:10,
      name:"Mohammed Strosin Jr.",
      age:56,
      email:"lisa",
      location:"witting@farrellblick.name_Lake Lewisport Arizona Paraguay"
    },{
      id:11,
      name:"Ms. Alex Bogisich",
      age:61,
      email:"rubye.bednar@aufderhar.name",
      location:"South Ericstad Oklahoma Nigeria"
    },{
      id:12,
      name:"Miles Waelchi",
      age:65,
      email:"gordon@stiedemann.org",
      location:"Monahanchester Arkansas Hungary"
    },{
      id:13,
      name:"Mrs. Meredith Schuppe",
      age:17,
      email:"eudora@lemke.net",
      location:"South Keaganshire Illinois Sri Lanka"
    },{
      id:14,
      name:"Mariela Volkman",
      age:2,
      email:"kian@ebertstroman.net",
      location:"Emmettstad West Virginia Mauritania"
    },{
      id:15,
      name:"Jessica Reilly",
      age:18,
      email:"ryder@keeblerboehm.org",
      location:"Elenormouth New Hampshire Senegal"
    },{
      id:16,
      name:"Willy Bednar",
      age:1,
      email:"estefaniaschaefer@gulgowski.biz",
      location:"Watersbury New Hampshire Cyprus"
    },{
      id:17,
      name:"Lucy Hansen",
      age:63,
      email:"dolores@hodkiewicz.net",
      location:"Port Anthony Oklahoma Timor-Leste"
    },{
      id:18,
      name:"Korey Will",
      age:29,
      email:"rogeliotorphy@kiehn.org",
      location:"Port Merleborough Illinois Jamaica"
    },{
      id:19,
      name:"Ceasar Blanda",
      age:71,
      email:"davonmcdermott@marks.org",
      location:"Schneidertown Louisiana Cocos (Keeling) Islands"
    }];
  }

  user(id) {
    return this.users()[id];
  }
  comments() {
    return {

    }
  }
}
