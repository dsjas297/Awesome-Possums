$(document).ready(function() {
    width = 20;
    height = 20;
    tile_size = 30;
    paper = Raphael('board', width * tile_size, height * tile_size);
    api = init_map(paper, width, height, tile_size);
    map = api.map;
    tiles_group = api.tiles_group;
    last_selected = {x: 0, y: 0};
});

var towers = function() {
    var api = Object();
    api['basic_tower'] = Object();
    api['basic_tower']['cost'] = 20;
    return api;
}

var colors = function() {
    var api = Object();
    api['terrain'] = '#569993';
    api['basic_tower'] = '#29FF73';
    api['selected_terrain'] = '#007167';
    return api;
}

var create_tile = function(paper, i, j, tile_size) {
    var tile = paper.rect(i*tile_size, j*tile_size,
       tile_size, tile_size); 
    tile.td = Object();
    tile.td.type = 'terrain';
    if (tile.td.type == 'terrain') {
        tile.attr('fill', colors()['terrain']);
    }
    tile.td.x = i;
    tile.td.y = j;
    tile.td.tower = null;
    return tile;
}

//create a map
var init_map = function(paper, width, height, tile_size) {
    var map = Array();
    var tiles_group = paper.set();
    var api = Object();
    for (var i = 0; i < height ; i++) {
        map[i] = Array();
        for (var j = 0; j < width; j++) {
            var tile = create_tile(paper, i, j, tile_size);
            tiles_group.push(tile);
            map[i][j] = tile;
        }
    }
    tiles_group.attr().click(select_terrain);
    api.map = map;
    api.tiles_group = tiles_group;
    return api;
}

var do_build_tower_menu = function(tile) {
    var menu = $('#tower_panel').append(
        '<div class="menu"></div>');
    var build_basic_button = $(
        '<button class="btn btn-primary" id="build_basic_tower" type="submit">Build Basic Tower: ' + towers().basic_tower.cost + '</button>');
    menu.append(build_basic_button);
    build_basic_button.attr('tower_type', 'basic');
    build_basic_button.attr('x', tile.td.x);
    build_basic_button.attr('y', tile.td.y);
    build_basic_button.bind('click', server_build_tower);
    //different tower you can place here
    //cost for tower
}

var server_build_tower = function() {
    client_build_tower(true, 
        this.getAttribute('x'), 
        this.getAttribute('y'),
        this.getAttribute('tower_type'), 
        50);
}

var client_build_tower = function(success, x, y, type, new_gold) {
    if (success) {
        log('Successfully built tower: ' + type);
        draw_tower(type, x, y);
        update_gold(new_gold);
    } else {
        log('Could not build tower.');
    }
}

var update_gold = function(gold) {
    $('#player_gold').html(gold);
}

var log = function(msg) {
    $('#log').html(msg);
}

var draw_tower = function(type, x, y) {
    if (type == 'basic') {
        map[x][y].td.tower = paper.circle(x*tile_size + tile_size/2, y*tile_size + tile_size/2, tile_size/3);
        map[x][y].td.tower.x = x;
        map[x][y].td.tower.y = y;
        map[x][y].td.tower.attr({'fill': colors()['basic_tower']}); 
        map[x][y].td.tower.click(select_tower);
    }
}

var select_terrain = function(e) {
    $('#tower_panel').html('');
    map[last_selected.x][last_selected.y].attr({'fill': colors()['terrain']});
    last_selected = {x: this.td.x, y: this.td.y};
    var tile = this;
    if (tile.td.type == 'terrain') {
        if (tile.td.tower == null) {
            tile.attr({'fill': colors()['selected_terrain']});
            do_build_tower_menu(tile);
        }
    }
}

var select_tower = function(e) {
    $('#tower_panel').html('');
    map[last_selected.x][last_selected.y].attr({'fill': colors()['terrain']});
    last_selected = {x: this.x, y: this.y};
    map[this.x][this.y].attr({'fill': colors()['selected_terrain']});
}
