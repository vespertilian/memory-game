import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { DisplayCard } from '../game.models';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  constructor(public gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.setup({
      players: 1,
      player1Name: 'Cameron',
      numberOfCards: 15,
    })
  }

  cardById(index: number, card: DisplayCard) {
    return card.id
  }

  ngOnDestroy() {
    console.log("***** Card component destroyed")
  }

}
