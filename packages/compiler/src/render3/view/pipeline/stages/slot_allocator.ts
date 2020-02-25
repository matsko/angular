/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import * as cir from '../ir/create';
import * as uir from '../ir/update';
import {visitAllExpressions} from '../ir/update';
import {ExpressionTransformer} from '../util/expression_transformer';
import {BaseTemplateStage} from './base';

export class SlotAllocationStage extends BaseTemplateStage<SlotAllocator, ExpressionSlotTransform> {
  private slotMap = new Map<cir.Id, cir.DataSlot>();
  private updateTransform = new ExpressionSlotTransform(this.slotMap);

  constructor() { super(); }

  protected makeCreateTransform(): SlotAllocator|null { return new SlotAllocator(this.slotMap); }

  protected makeUpdateTransform() { return this.updateTransform; }

  get expressionTransform(): uir.Transform { return new ExpressionSlotTransform(this.slotMap); }
}

class SlotAllocator implements cir.Transform {
  private slot = 0;

  constructor(private slotMap: Map<cir.Id, cir.DataSlot>) {}

  private allocateSlotFor(id: cir.Id): cir.DataSlot {
    if (this.slotMap.has(id)) {
      throw new Error('AssertionError: a slot has already been assigned for this element');
    }
    const slot = (this.slot++) as cir.DataSlot;
    this.slotMap.set(id, slot);
    return slot;
  }

  visit(node: cir.Node): cir.Node {
    switch (node.kind) {
      case cir.Kind.ElementStart:
      case cir.Kind.Element:
      case cir.Kind.Text:
        node.slot = this.allocateSlotFor(node.id);
        break;
      case cir.Kind.Template:
        node.slot = this.allocateSlotFor(node.id);
        break;
    }
    return node;
  }
}

class ExpressionSlotTransform extends ExpressionTransformer implements uir.Transform {
  constructor(private slotMap: Map<cir.Id, cir.DataSlot>) { super(); }

  private slotFor(id: cir.Id): cir.DataSlot {
    if (!this.slotMap.has(id)) {
      throw new Error(`Could not find slot for id ${id}`);
    }
    return this.slotMap.get(id) !;
  }

  visit(node: uir.Node): uir.Node {
    visitAllExpressions(node, this);
    return node;
  }

  visitEmbeddedExpression(expr: uir.EmbeddedExpression): uir.EmbeddedExpression {
    switch (expr.value.kind) {
      case uir.ExpressionKind.Reference:
        expr.value.slot = this.slotFor(expr.value.id);
        break;
    }
    return expr;
  }
}
