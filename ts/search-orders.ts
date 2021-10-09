import $ from 'jquery';
import { OrderList } from './dto/OrderList';


const BASE_API = 'http://localhost:8080/pos';
const ORDERLIST_SERVICE_API = `${BASE_API}/orders`;
const PAGE_SIZE = 6;

let orders: Array<OrderList> = [];
let totalOrders = 0;
let selectedPage = 1;
let pageCount = 1;

loadAllOrders();

$("#btn-search").on('click', (eventData) => {
    eventData.preventDefault();
    loadAllOrders();
});

$("#txt-search").on('input', () => {
    console.log("type");
    
    loadAllOrders();

});


/* Functionds */
/* Load customers */
function loadAllOrders(): void {

    const http = new XMLHttpRequest();

    http.onreadystatechange = ()=> {

        if (http.readyState === http.DONE) {

            if (http.status !== 200) {
                alert("Failed to fetch order List, try again...!");
                return;
            }

            totalOrders = +(http.getResponseHeader('X-Total-Count'));
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
        http.open('GET', ORDERLIST_SERVICE_API + `?page=${selectedPage}&size=${PAGE_SIZE}`, true);

        // 4. Setting headers, etc.
    
        http.send();
}

/* NAVIGATIONS */
function initPagination(): void {

    pageCount = Math.ceil(totalOrders / PAGE_SIZE);

    showOrHidePagination();
    if (pageCount === 1) return;
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

