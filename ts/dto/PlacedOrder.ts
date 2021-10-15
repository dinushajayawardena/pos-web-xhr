import { ItemSet } from "./ItemSet";

export class PlacedOrder{
    constructor(public orderId:string,
                public date:Date,
                public customerId:String,
                public orderDetails: Array<ItemSet>){
                    
                }
}