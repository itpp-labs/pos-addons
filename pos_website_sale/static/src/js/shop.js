$(document).ready(function () {
    $(".oe_website_sale input.js_quantity").change(function () {
        var $input = $(this);
        var value = parseInt($input.val(), 10);
        if (isNaN(value)) value = 0;
        openerp.jsonRpc("/shop/cart/update_json", 'call', {
            'line_id': parseInt($input.data('line-id'),10),
            'product_id': parseInt($input.data('product-id'),10),
            'set_qty': value})
            .then(function (data) {
                if (!data.quantity) {
                    location.reload();
                    return;
                }
                var $q = $(".my_cart_quantity");
                $q.parent().parent().removeClass("hidden", !data.quantity);
                $q.html(data.cart_quantity).hide().fadeIn(600);
                $input.val(data.quantity);
                $("#cart_total").replaceWith(data['website_sale.total']);
            });
    });
    $('.oe_website_sale .oe_product_cart .oe_product_image a').on('click', function (ev) {
        //ev.preventDefault();
        var $input = $(ev.currentTarget).parent().parent().find("input");
        $input.val(1 + parseFloat($input.val(),10));
        $input.change();
        $input.css('background-color', '#428bca').stop().animate({backgroundColor:'white'}, 500)
        return false;
    });

    openerp.jsonRpc("/shop/get_order_numbers", 'call').then(function(data){
        if (!data)
            return;
        $.each(data, function(product_id, num){
            $('input[data-product-id="'+product_id+'"]').val(num)
        })
    })

})