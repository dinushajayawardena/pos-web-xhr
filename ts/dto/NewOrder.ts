import { Customer } from "./customer";
import { Item } from "./item";

export class NewOrder{
    constructor(public orderId: string,
        public customer: Array<Customer>,
        public items: Array<Item>,
        public qty: number,
        public unitPrice: number,
        public total: number){

        }
}