import $, { event } from 'jquery';
import { format } from 'path/posix';
import { Customer } from './dto/customer';
import { CustomerSet } from './dto/CustomerSet';
import { Item } from './dto/item';
import { ItemList } from './dto/ItemList';
import { ItemsAdded } from './dto/ItemsAdded';
import { ItemSet } from './dto/ItemSet';
import { OrderList } from './dto/OrderList';
import { PlacedOrder } from './dto/PlacedOrder';

const BASE_API = 'http://localhost:8080/pos';
const PLACEORDER_SERVICE_API = `${BASE_API}/orders`;
const CUSTOMERS_SERVICE_API = `${BASE_API}/customers`;
const STOCK_SERVICE_API = `${BASE_API}/items`;
const PAGE_SIZE = 6;

let orders: Array<OrderList> = [];
let customers: Array<Customer> = [];
let items: Array<Item> = [];
let customerSet: Array<CustomerSet> = [];
let itemSet: Array<ItemSet> = [];
let listOfItems: Array<ItemsAdded> = [];
let placedOrder: PlacedOrder;
let itemList: Array<ItemList> = [];
let totalOrders = 0;
let totalCustomers = 0;
let totalItems = 0;
let selectedCustomerId: undefined|string;
let selectedItemCode: undefined|string;
let selectedCustomerName = '';
let selectedPage = 1;
let pageCount = 1;
let selectedItemId = '';

let itemTotal = 0;

loadAllOrders();
loadAllCustomers();
loadAllItems();
getName();
clearForm();  

/* EVENTS */

$('#item-qty').on('keypress', ()=>{
    
});

$('#btn-remove-item').prop('disabled', true);

/* Item Add Button Event */
$('#btn-add-item').on('click', (eventData)=>{
    eventData.preventDefault();

    let validate = true;
    let id = "";
    let requestedQty: number = 0;
    let price = 0;
    let isDuplicated = false;
    let total = 0;
    
    id = $('#item-ids option:selected').text();
    requestedQty = $('#item-qty').val() as number;
    price = $('#item-price').val() as number;

    /* validations */
    if(id === null){
        alert("Please select an Item first!");
        $('#item-ids').trigger('focus').trigger('select');
        validate = false;
        return;
    }


    if(requestedQty == 0 || /d/.test(requestedQty+"")){
        alert("Please enter a valid quantity!");
        $('#item-qty').trigger('focus').trigger('select');
        validate = false;
        return;
    }

    if(price == 0.00){
        alert("Something wrong with loading item data. Try again...!");
        $('#item-price').trigger('focus').trigger('select');
        validate = false;
        return;
    }

    /* Ready to add/update item */

        listOfItems.forEach(i => {
            if(i.itemIdentifier === id){
                
                let oldQty:number = i.requestedQty;
                let newQty = parseInt(oldQty) + parseInt(requestedQty);
                i.requestedQty = newQty;
                isDuplicated = true;
            }
        });
            
            /* Add as a new item */
            if(!isDuplicated){

                let itemToBeAdded = new ItemsAdded(id, requestedQty, price);
                listOfItems.push(itemToBeAdded);
    
                let html ='';
                for (let i = 0; i < listOfItems.length; i++) {
                            
                html += `<option>${listOfItems[i].itemIdentifier}</option>`;
                    itemSet.push(new ItemSet(items[i].code, items[i].qtyOnHand, items[i].unitPrice));
                }
                $("#added-items").html(html);

            }

            listOfItems.forEach(i =>{

                total = total + i.requestedQty * i.unitPrice;

            });

            $('#txt-total').text('Total : '+ total);

        /* Clear item input set */
        $('#item-qty').val(0);
        $('#item-ids').trigger('focus').trigger('select');
        

        // $('#btn-remove-item').trigger('click');
    
});

/* Item selection Event */
$('#added-items').on('click', (eventData)=>{

    $('#btn-remove-item').prop('disabled', false);

    selectedItemId = $('#added-items option:selected').text();

    $('#btn-remove-item').attr('disabled');

    listOfItems.forEach(i=>{
        if(i.itemIdentifier === selectedItemId){
            $('#item-ids').val(i.itemIdentifier);
            $('#item-qty').val(i.requestedQty);
        }
    });

    getItemDetails();

});

/* Save Button Event */
$('#btn-save').on('click', (eventData) => {
    eventData.preventDefault();

    let tempTotal: string[] = ($('#txt-total').text()).split(':');
    const txtOrderId = $('#order-id');
    const txtCusId = $('#cus-ids');
    const txtCusName = $('#cus-name');
    const arrayItemList: Array<ItemsAdded> = [];
    const total: number = tempTotal[1].trim();
    const items: Array<ItemList> = [];

    let orderId = (txtOrderId.val() as string).trim();
    let cusId = (txtCusId.val() as string).trim();
    let customerName = (txtCusName.val() as string).trim();

    let validated = true;
    $('#order-id, #cus-ids, #cus-name').removeClass('is-invalid');

    // console.log(tempTotal[1]);
    
    
    if(total <= 0){
        $('#txt-total').addClass('is-invalid');
        alert("Order Total is invalid")
        validated = false;
    }
    
    if (listOfItems.length <= 0) {
        validated = false;
    }
    
    if (!/^[A-Za-z ]+$/.test(customerName)) {
        txtCusName.addClass('is-invalid');
        txtCusName.trigger('select');
        validated = false;
    }
    
    if (!/^OD\d{3}$/.test(orderId)) {
        txtOrderId.addClass('is-invalid');
        txtOrderId.trigger('select');
        validated = false;
    }
    
    if (!validated) return;
    if (txtOrderId.attr('disabled')) {

        const selectedRow = $("#tbl-customers tbody tr.selected");
        // updateCustomer(new Customer(id, cusId, address));
        return;
    }

    const fulldate: Date = new Date();
    let year = fulldate.getFullYear();
    let month = (String("0" + (fulldate.getMonth() + 1)).slice(-2)).trim();
    let date = (String("0" + fulldate.getDate()).slice(-2)).trim();

    const dateOfOrder: string = year + "-" + month + "-" + date;


    listOfItems.forEach(i =>{
        let code = i.itemIdentifier.split('-')

        items.push(new ItemList(code[0].trim(), i.requestedQty, i.unitPrice));
    });
    
    saveOrder(new PlacedOrder( orderId, dateOfOrder, cusId, customerName, total, items));

});

/* Delete Button Event */
$('#tbl-customers tbody').on('click', '#trash-td', function (eventData) {
    if (confirm('Are you sure to delete?')) {
        deleteCustomer(($(eventData.target).parents("tr").find('td:first-child')).text());
    }
});

/* Clear Button Event */
$('#btn-clear').on('click', () => {
    $("#tbl-customers tbody tr.selected").removeClass('selected');
    $("#txt-id").removeAttr('disabled').trigger('focus');
    $('#txt-id').removeAttr('disabled');
});

/* Remove item button Event */
$('#btn-remove-item').on('click', ()=>{

    // console.log(listOfItems);
    

    var isReadyToDelete = confirm("Are you sure to delete the item..?");

    if(isReadyToDelete){

        listOfItems.forEach(i=>{
            if(i.itemIdentifier === selectedItemId){

                const index = listOfItems.indexOf(i);
                // console.log(index);
                

                if(index > -1){
                    listOfItems.splice(index, 1);
                    // console.log(listOfItems);
                }

                
            }
        });

        $('#added-items').html('');
    
                let html ='';
                for (let i = 0; i < listOfItems.length; i++) {
                            
                html += `<option>${listOfItems[i].itemIdentifier}</option>`;
                    itemSet.push(new ItemSet(items[i].code, items[i].qtyOnHand, items[i].unitPrice));
                }
                $("#added-items").html(html);

        $('#item-qty').val(0);
    
        $('#btn-remove-item').prop('disabled', true);

    }

});

/* Table row selection */
$('#tbl-customers tbody').on('click', 'tr', function () {

    const id = $(this).find("td:first-child").text();
    const name = $(this).find("td:nth-child(2)").text();
    const address = $(this).find("td:nth-child(3)").text();

    $('#txt-id').val(id).attr('disabled', "true");
    $('#txt-name').val(name);
    $('#txt-address').val(address);

    $("#tbl-customers tbody tr").removeClass('selected');
    $(this).addClass('selected');

});


/* Get the name of the selected customer */
$('#cus-ids').on('change', ()=>{
    getName();
     
});

itemSelector(); 

function itemSelector(){

    /* Get details of the selected item */
    $('#item-ids').on('change', ()=>{
        getItemDetails();

    });

}

$('#item-qty').on('click', function(){
    $(this).select();
});

/////////////////////////////////////////////
    
/* FUNCTIONS */

/* get the name of current customer */
function getName():void{
        selectedCustomerId = ($('#cus-ids option:selected').text());
    
    
    for (const customer of customerSet) {
        
        if(customer.id === selectedCustomerId){
            $('#cus-name').val(customer.name);  
        } 
    }
}

function getItemDetails() : void{
    selectedItemCode = ($('#item-ids option:selected').text());
   // console.log(selectedItemCode);
    
    
    for (const item of itemSet) {

        let x = selectedItemCode.split('-');
        
        
        if(item.code === x[0].trim()){
            
            $('#item-price').val(item.unitPrice);  
        } 
    }
}

/* Load customers */
function loadAllOrders(): void {

    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

            if (http.status !== 200) {
                alert("Failed to fetch order List, try again...!");
                return;
            }

            totalOrders = +(http.getResponseHeader('X-Total-Count')+ "");
            orders = JSON.parse(http.responseText);

            $('#tbl-orders tbody tr').remove();

            orders.forEach((od) => {
                const rowHtml = `<tr>
                 <td>${od.orderId}</td>
                 <td>${od.customerId}</td>
                 <td>${od.customerName}</td>
                 <td>${od.orderDate}</td>
                 <td>${od.orderTotal}</td>
                 </tr>` ;

                $('#tbl-orders tbody').append(rowHtml);
            });

            initPagination();

        }

    };

        // http://url?page=10&size=10
        http.open('GET', PLACEORDER_SERVICE_API + `?page=${selectedPage}&size=${PAGE_SIZE}`, true);

        // 4. Setting headers, etc.
    
        http.send();
}

/* Load customers */
function loadAllCustomers(): void {

    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

            if (http.status !== 200) {
                alert("Failed to fetch customers, try again...!");
                return;
            }

            totalCustomers = +(http.getResponseHeader('X-Total-Count') + "");
            customers = JSON.parse(http.responseText);

            let html ='';
            customerSet = [];
            for (let i = 0; i < customers.length; i++) {
                // console.log(customers[i].id, customerhtmls[i].name);   
                html += `<option>${customers[i].id}</option>`;
                customerSet.push(new CustomerSet(customers[i].id, customers[i].name));
            }
            $("#cus-ids").html(html);
            $("#cus-ids").val('');

        }

    };

        // http://url?page=10&size=10
        http.open('GET', CUSTOMERS_SERVICE_API, true);

        // 4. Setting headers, etc.
    
        http.send();
    
}

/* load items */
function loadAllItems():void{
    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

           // console.log(http.status);
            

            if (http.status !== 200) {
                alert("Failed to fetch items, try again...!");
                return;
            }

            totalItems = +(http.getResponseHeader('X-Total-Count') + "");
            items = JSON.parse(http.responseText);

            
            let html ='';
            for (let i = 0; i < items.length; i++) {
                // console.log(customers[i].id, customers[i].name);   
                html += `<option>${items[i].code} - ${items[i].description}</option>`;
                itemSet.push(new ItemSet(items[i].code, items[i].unitPrice, items[i].qtyOnHand));
            }
            $("#item-ids").html(html);
            $("#item-ids").val('');
        }

    };

        // http://url?page=10&size=10
        http.open('GET', STOCK_SERVICE_API, true);

        // 4. Setting headers, etc.
    
        http.send();
}

/* Save customers */
function saveOrder(order: PlacedOrder): void{
    const http = new XMLHttpRequest();

    // console.log(order);

    http.onreadystatechange = () => {

        // console.log("State: " + http.readyState);
        
        if (http.readyState !== http.DONE) return;

        if (http.status !== 201) {
            console.error(http.responseText);
            alert("Failed to save the order, retry");
            return;
        }

        alert("Order has been saved successfully");

        clearForm();

        totalOrders++;
        pageCount = Math.ceil(totalOrders / PAGE_SIZE);

        navigateToPage(pageCount);
        $('#txt-id, #txt-name, #txt-address').val('');
        $('#txt-id').trigger('focus');

    };

    http.open('POST', PLACEORDER_SERVICE_API, true);

    http.setRequestHeader('Content-Type', 'application/json');

    http.send(JSON.stringify(order));

}

/* Delete customers */
function deleteCustomer(id: string): void {
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState === http.DONE) {

            if (http.status !== 204) {
                alert("Failed to delete customer, try again...!");
                return;
            }

            totalCustomers--;
            pageCount = Math.ceil(totalCustomers / PAGE_SIZE);            
            navigateToPage(pageCount);

        }

    };

    http.open('DELETE', CUSTOMERS_SERVICE_API + `?id=${id}`, true);

    http.send();
}

/* Update customer */
function updateCustomer(customer: Customer): void {
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState !== http.DONE) return;

        if (http.status !== 204) {
            alert("Failed to update the customer, retry");
            return;
        }

        alert("Customer has been updated successfully");
        
        $("#tbl-customers tbody tr.selected").find("td:nth-child(2)").text($("#txt-name").val() + "");
        $("#tbl-customers tbody tr.selected").find("td:nth-child(3)").text($("#txt-address").val() + "");
        $('#txt-id, #txt-name, #txt-address').val('');
        $('#txt-id').trigger('focus');
        $("#tbl-customers tbody tr.selected").removeClass('selected');
        $('#txt-id').removeAttr('disabled');

    };

    http.open('PUT', CUSTOMERS_SERVICE_API, true);

    http.setRequestHeader('Content-Type', 'application/json');

    http.send(JSON.stringify(customer));

}

/* NAVIGATIONS */
function initPagination(): void {

    pageCount = Math.ceil(totalOrders / PAGE_SIZE);

    showOrHidePagination();
    if (pageCount === 1) return;

    let html = `<li class="page-item"><a class="page-link" href="#!">Previous</a></li>`;

    for (let i = 0; i < pageCount; i++) {
        html += `<li class="page-item ${selectedPage === (i + 1) ? 'active' : ''}"><a class="page-link" href="javascript:void(0);">${i + 1}</a></li>`;
    }

    html += `<li class="page-item"><a class="page-link" href="javascript:void(0);">Next</a></li>`;

    $("ul.pagination").html(html);

    if (selectedPage === 1) {
        $(".page-item:first-child").addClass('disabled');
    } else if (selectedPage === pageCount) {
        $(".page-item:last-child").addClass('disabled');
    }

    $(".page-item:first-child").on('click', () => navigateToPage(selectedPage - 1));
    $(".page-item:last-child").on('click', () => navigateToPage(selectedPage + 1));

    $(".page-item:not(.page-item:first-child, .page-item:last-child)").on('click', function () {
        navigateToPage(+$(this).text());
    });

}

function navigateToPage(page: number): void {

    if (page < 1 || page > pageCount) return;

    selectedPage = page;
    loadAllOrders();

}

function showOrHidePagination(): void {
    pageCount > 1 ? $(".pagination").show() : $('.pagination').hide();
}

function clearForm(): void {
    
    $('#order-id').val('');
    $('#cus-ids').val('');
    $('#cus-name').val('');
    $('#item-ids').val('');
    $('#added-items').val('');
    $('#item-qty').val('0');    
    $('#item-price').val('0.00');    
    $('#txt-total').text('Total : 0.00');    
    $("#added-items").html('');
    listOfItems = [];

    $('#order-id').trigger('focus');
    
}