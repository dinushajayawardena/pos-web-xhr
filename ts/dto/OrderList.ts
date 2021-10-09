export class OrderList{
    constructor(public orderId: string,
        public customerId: string,
        public customerName: string,
        public orderDate: Date,
        public orderTotal: number){
        }


}