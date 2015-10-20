import {Component, CORE_DIRECTIVES, FORM_DIRECTIVES, View} from 'angular2/angular2';

import './animations';

@Component({
  selector: 'animate-app'
})
@View({
  templateUrl: 'app.html',
  directives: [CORE_DIRECTIVES, FORM_DIRECTIVES]
})
export class AnimateAppCmp {
  public q = "";
  private _show = false;

  private _items = [
    {name:"Maxie Weimann", age:12, email:"ardith.paucek@sporer.org", country:"Gibraltar"},
    {name:"Imogene Runte", age:12, email:"cloyd@schmidtroob.org", country:"British Indian Ocean Territory (Chagos Archipelago)"},
    {name:"Georgianna Strosin", age:12, email:"ashly@botsford.biz", country:"Australia"},
    {name:"Cale Kutch", age:62, email:"beryl_emard@beckerstehr.biz", country:"Kenya"},
    {name:"Audrey Kutch", age:21, email:"scot@oberbrunnerfay.org", country:"Slovakia (Slovak Republic)"},
    {name:"Malika Konopelski", age:55, email:"heath_walter@simonisbecker.biz", country:"Bouvet Island (Bouvetoya)"},
    {name:"Eliane Kuphal", age:3, email:"elian@considine.org", country:"Tanzania"},
    {name:"Lauren Kunze", age:6, email:"zora_ebert@mcdermott.net", country:"Comoros"},
    {name:"Cloyd Medhurst", age:10, email:"reva_jenkins@reinger.name", country:"Mayotte"},
    {name:"Jamel Quitzon", age:41, email:"emilie@heaneystreich.biz", country:"French Polynesia"},
    {name:"Sigmund Bogan", age:64, email:"roselyn@bartolettiabshire.net", country:"Guatemala"},
    {name:"Rylee Spencer", age:10, email:"sarai@osinski.org", country:"Western Sahara"},
    {name:"Annalise Wuckert", age:91, email:"sammy@stoltenberg.com", country:"Latvia"},
    {name:"Rosa Abbott", age:85, email:"isabell.wiza@danielmclaughlin.info", country:"Paraguay"},
    {name:"Rubie Ratke", age:49, email:"mathew_nikolaus@starkupton.com", country:"Belize"},
    {name:"Geovanny Wisoky", age:72, email:"gaetano.hamill@williamsonprosacco.com", country:"Saint Pierre and Miquelon"},
    {name:"Maryjane Robel", age:8, email:"dylan@brekke.info", country:"French Polynesia"},
    {name:"Libbie Beahan", age:97, email:"aryanna@abbott.net", country:"Tonga"},
    {name:"Ewald Borer", age:83, email:"nicholaus_kuhic@kiehnankunding.org", country:"Zambia"},
    {name:"Joaquin Jaskolski", age:44, email:"caesar_king@bayer.net", country:"Guatemala"}
  ];

  public showItems() {
    this._show = true;
  }

  public hideItems() {
    this._show = false;
  }

  get items() {
    return this._show ? this._items : [];
  }
}

