function testInject(){
    console.log('code is injected!');
    return 1;
}

window.mstest = {
    is_wait: false,
    _rand: function($list){
        return $list.eq(Math.floor(Math.random() * $list.length));
    },
    gc: function(){
        url = '/pos_multi_session/test/gc';
        $.ajax(url, {
            dataType: 'json',
            type: 'POST',
            data: '{}',
            contentType: 'application/json'
        }).done(function(res){
            if (res.error){
                console.log('error', 'error on GC');
            }
        }).fail(function(){
            console.log('error', 'cannot call GC');
        });
    },
    fill_order: function(){
        this._rand($('.product')).click();
        this._rand($('.product')).click();
    },
    save_order: function(){
        lines = [];
        $('.orderline').each(function(){
            lines.push({
                'name': $.trim($(this).find('.product-name').text()),
                'price': $.trim($(this).find('.price').text()),
                'qty': $.trim($(this).find('.info em').text()),
            });
        });
        order = {
            "lines": lines,
            "order_num": parseInt($('.order-button.select-order.selected .order-sequence').text())
        };
        //console.log('save_order', JSON.stringify(order))
        return order;
    },
    find_order: function(order){
        $('.order-sequence').each(function(){
            if ($.trim($(this).text()) == order.order_num){
                $(this).click();
                return false;
            }
        });
        found = this.save_order();
        if (JSON.stringify(order) !== JSON.stringify(found)){
            console.log('Expected Order', JSON.stringify(order));
            console.log('Found Order', JSON.stringify(found));
            console.log('error', 'Synced orders are mismatched');
        }
        return found;
    },
    wait: function(callback, timeout){
        mstest.is_wait = true;
        setTimeout(function(){
            mstest.is_wait = false;
            callback();
        }, timeout || 1000);
    },

};
