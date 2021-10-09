import $ from 'jquery';
import { Customer } from './dto/customer';

const BASE_API = 'http://localhost:8080/pos';
const CUSTOMERS_SERVICE_API = `${BASE_API}/customers`;
const PAGE_SIZE = 6;

let customers: Array<Customer> = [];
let totalCustomers = 0;
let selectedPage = 1;
let pageCount = 1;

loadAllCustomers();


/* EVENTS */

/* Save Button Event */
$('#btn-save').on('click', (eventData) => {
    eventData.preventDefault();

    const txtId = $('#txt-id');
    const txtName = $('#txt-name');
    const txtAddress = $('#txt-address');

    let id = (txtId.val() as string).trim();
    let name = (txtName.val() as string).trim();
    let address = (txtAddress.val() as string).trim();

    let validated = true;
    $('#txt-id, #txt-name, #txt-address').removeClass('is-invalid');

    if (address.length < 3) {
        txtAddress.addClass('is-invalid');
        txtAddress.trigger('select');
        validated = false;
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
        txtName.addClass('is-invalid');
        txtName.trigger('select');
        validated = false;
    }

    if (!/^C\d{3}$/.test(id)) {
        txtId.addClass('is-invalid');
        txtId.trigger('select');
        validated = false;
    }

    if (!validated) return;

    if (txtId.attr('disabled')) {

        const selectedRow = $("#tbl-customers tbody tr.selected");
        updateCustomer(new Customer(id, name, address));
        return;
    }


    saveCustomer(new Customer(id, name, address));
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

/////////////////////////////////////////////
    
/* FUNCTIONS */


/* Load customers */
function loadAllCustomers(): void {

    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

            if (http.status !== 200) {
                alert("Failed to fetch customers, try again...!");
                return;
            }

            totalCustomers = +(http.getResponseHeader('X-Total-Count'));
            customers = JSON.parse(http.responseText);

            $('#tbl-customers tbody tr').remove();

            customers.forEach((c) => {
                const rowHtml = `<tr>
                 <td>${c.id}</td>
                 <td>${c.name}</td>
                 <td>${c.address}</td>
                 <td id="trash-td"><i class="fas fa-trash trash"></i></td>
                 </tr>` ;


                $('#tbl-customers tbody').append(rowHtml);
            });

            initPagination();

        }

    };

        // http://url?page=10&size=10
        http.open('GET', CUSTOMERS_SERVICE_API + `?page=${selectedPage}&size=${PAGE_SIZE}`, true);

        // 4. Setting headers, etc.
    
        http.send();
    
}

/* Save customers */
function saveCustomer(customer: Customer): void{
    const http = new XMLHttpRequest();

    http.onreadystatechange = () => {

        if (http.readyState !== http.DONE) return;

        if (http.status !== 201) {
            console.error(http.responseText);
            alert("Failed to save the customer, retry");
            return;
        }

        alert("Customer has been saved successfully");

        totalCustomers++;
        pageCount = Math.ceil(totalCustomers / PAGE_SIZE);

        navigateToPage(pageCount);
        $('#txt-id, #txt-name, #txt-address').val('');
        $('#txt-id').trigger('focus');
    };

    http.open('POST', CUSTOMERS_SERVICE_API, true);

    http.setRequestHeader('Content-Type', 'application/json');

    http.send(JSON.stringify(customer));
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

    pageCount = Math.ceil(totalCustomers / PAGE_SIZE);

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
    loadAllCustomers();

}

function showOrHidePagination(): void {
    pageCount > 1 ? $(".pagination").show() : $('.pagination').hide();
}

