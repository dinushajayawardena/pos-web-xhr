export class ItemsAdded{
    public constructor(public itemIdentifier:string,
        public requestedQty: number,
        public unitPrice: number){

        }
}