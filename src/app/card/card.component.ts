import { Component, Input } from '@angular/core';
import { CardState, DisplayCard } from '../game.models';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  public stateOptions = CardState
  @Input() card: DisplayCard | null  = null
}

