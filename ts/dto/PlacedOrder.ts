import { ItemList } from "./ItemList";

export class PlacedOrder{
    constructor(public orderId:string,
                public orderDate:string,
                public customerId:String,
                public customerName:String,
                public orderTotal:number,
                public orderDetails: Array<ItemList>){
                    
                }
}