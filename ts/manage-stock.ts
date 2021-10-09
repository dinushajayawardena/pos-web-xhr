import $ from 'jquery';
import { Item } from './dto/item';

const BASE_API = 'http://localhost:8080/pos';
const CUSTOMERS_SERVICE_API = `${BASE_API}/items`;
const PAGE_SIZE = 6;

let items: Array<Item> = [];
let totalItems = 0;
let selectedPage = 1;
let pageCount = 1;


/* INITIALIZATION */
loadAllItems();

/* EVENTS */

/* Save Button Event */
$('#btn-save').on('click', (eventData) => {
    eventData.preventDefault();

    const txtCode = $('#txt-id');
    const txtDescription = $('#txt-description');
    const txtUnitPrice = $('#txt-unitprice');
    const txtQtyOnHand = $('#txt-qtyonhand');

    let id = (txtCode.val() as string).trim();
    let description = (txtDescription.val() as string).trim();
    let unitPrice = txtUnitPrice.val();
    let qtyOnHand = txtQtyOnHand.val();

    let validated = true;
    $('#txt-id, #txt-description, #txt-unitprice, #txt-qtyonhand').removeClass('is-invalid');

    if (!/^\d{0,8}?$/.test(qtyOnHand + "")) {
        txtQtyOnHand.addClass('is-invalid');
        txtQtyOnHand.trigger('select');
        validated = false;
    }

    if (!/^(\d+(\.\d{0,2})?|\.?\d{1,2})$/.test(unitPrice + "")) {
        txtUnitPrice.addClass('is-invalid');
        txtUnitPrice.trigger('select');
        validated = false;
    }

    if (description.length < 3) {
        txtDescription.addClass('is-invalid');
        txtDescription.trigger('select');
        validated = false;
    }

    if (!/^I\d{3}$/.test(id)) {
        txtCode.addClass('is-invalid');
        txtCode.trigger('select');
        validated = false;
    }
    

    if (!validated) return;

    if (txtCode.attr('disabled')) {

        const selectedRow = $("#tbl-items tbody tr.selected");
        updateItem(new Item(id, description, unitPrice as number, qtyOnHand as number));
        return;
    }


    saveItem(new Item(id, description, unitPrice as number, qtyOnHand as number));
});

/* Delete Button Event */
$('#tbl-items tbody').on('click', '#trash-td', function (eventData) {
    if (confirm('Are you sure to delete?')) {
        deleteCustomer(($(eventData.target).parents("tr").find('td:first-child')).text());
    }
});

/* Clear Button Event */
$('#btn-clear').on('click', () => {
    $("#tbl-items tbody tr.selected").removeClass('selected');
    $("#txt-id").removeAttr('disabled').trigger('focus');
    $('#txt-id').removeAttr('disabled');
});

/* Table row selection */
$('#tbl-items tbody').on('click', 'tr', function () {

    const code = $(this).find("td:first-child").text();
    const description = $(this).find("td:nth-child(2)").text();
    const unitPrice = $(this).find("td:nth-child(3)").text();
    const qtyOnHand = $(this).find("td:nth-child(4)").text();

    $('#txt-id').val(code).attr('disabled', "true");
    $('#txt-description').val(description);
    $('#txt-unitprice').val(unitPrice);
    $('#txt-qtyonhand').val(qtyOnHand);

    $("#tbl-items tbody tr").removeClass('selected');
    $(this).addClass('selected');

});


//////////////////////////////////

/* FUNCTIONS */

function loadAllItems():void{
    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

            console.log(http.status);
            

            if (http.status !== 200) {
                alert("Failed to fetch items, try again...!");
                return;
            }

            totalItems = +(http.getResponseHeader('X-Total-Count') + "");
            items = JSON.parse(http.responseText);

            $('#tbl-items tbody tr').remove();

            items.forEach((i) => {
                const rowHtml = `<tr>
                 <td>${i.code}</td>
                 <td>${i.description}</td>
                 <td>${i.unitPrice}</td>
                 <td>${i.qtyOnHand}</td>
                 <td id="trash-td"><i class="fas fa-trash trash"></i></td>
                 </tr>` ;


                $('#tbl-items tbody').append(rowHtml);
            });

            
            
            // initPagination();

        }

    };

        // http://url?page=10&size=10
        http.open('GET', CUSTOMERS_SERVICE_API + `?page=${selectedPage}&size=${PAGE_SIZE}`, true);

        // 4. Setting headers, etc.
    
        http.send();
}

/* Save item */
function saveItem(item: Item): void{
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState !== http.DONE) return;

        if (http.status !== 201) {
            console.error(http.responseText);
            alert("Failed to save the item, retry");
            return;
        }

        alert("Item has been saved successfully");

        totalItems++;
        pageCount = Math.ceil(totalItems / PAGE_SIZE);

        navigateToPage(pageCount);
        $('#txt-id, #txt-description, #txt-unitprice, #txt-qtyonhand').val('');
        $('#txt-id').trigger('focus');
    };

    http.open('POST', CUSTOMERS_SERVICE_API, true);

    http.setRequestHeader('Content-Type', 'application/json');

    http.send(JSON.stringify(item));
}

/* Delete customers */
function deleteCustomer(id: string): void {
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState === http.DONE) {

            console.log(http.status);

            if (http.status !== 204) {
                alert("Failed to delete item, try again...!");
                return;
            }

            totalItems--;
            pageCount = Math.ceil(totalItems / PAGE_SIZE);            
            navigateToPage(pageCount);

        }

    };

    http.open('DELETE', CUSTOMERS_SERVICE_API + `?code=${id}`, true);

    http.send();
}

/* Update customer */
function updateItem(item: Item): void {
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState !== http.DONE) return;

        if (http.status !== 204) {
            alert("Failed to update the item, retry");
            return;
        }

        alert("Item has been updated successfully");
        
        $("#tbl-items tbody tr.selected").find("td:nth-child(2)").text($("#txt-description").val() + "");
        $("#tbl-items tbody tr.selected").find("td:nth-child(3)").text($("#txt-unitprice").val() + "");
        $("#tbl-items tbody tr.selected").find("td:nth-child(4)").text($("#txt-qtyonhand").val() + "");
        $('#txt-id, #txt-description, #txt-unitprice, #txt-qtyonhand').val('');
        $('#txt-id').trigger('focus');
        $("#tbl-items tbody tr.selected").removeClass('selected');
        $('#txt-id').removeAttr('disabled');

    };

    http.open('PUT', CUSTOMERS_SERVICE_API, true);

    http.setRequestHeader('Content-Type', 'application/json');

    http.send(JSON.stringify(item));

}

/* NAVIGATIONS */
function initPagination(): void {

    pageCount = Math.ceil(totalItems / PAGE_SIZE);

    showOrHidePagination();
    if (pageCount === 1) return;

    let html = `<li class="page-item"><a class="page-link" href="#!">«</a></li>`;

    for (let i = 0; i < pageCount; i++) {
        html += `<li class="page-item ${selectedPage === (i + 1) ? 'active' : ''}"><a class="page-link" href="javascript:void(0);">${i + 1}</a></li>`;
    }

    html += `<li class="page-item"><a class="page-link" href="javascript:void(0);">»</a></li>`;

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
    loadAllItems();

}

function showOrHidePagination(): void {
    pageCount > 1 ? $(".pagination").show() : $('.pagination').hide();
}

