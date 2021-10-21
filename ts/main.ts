 import $ from 'jquery';
 let aside = $('.main-sidebar');

 $('.nav-item').on('click', ()=>{


    if(!aside.is(':visible')){
        
        aside.css('display', 'unset');
    }
    
 });

 $('.drawer-icon').on('click', ()=>{

    aside.css('display', 'none');

 });


