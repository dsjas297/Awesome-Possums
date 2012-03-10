$(document).ready(function() {
    width = 10;
    height = 10;
    tile_size = 40;
    paper = Raphael('board', width * tile_size, height * tile_size);
    api = init_map(paper, width, height, tile_size);
    map = api.map;
    tiles_group = api.tiles_group;
    game_tick_ms = 100;
    last_selected = {x: 0, y: 0};

    path = Object();
    initialize_path();

    creeps = Object();
    update_creep_loop();
});

var initialize_path = function()
{
    path.0 = {x: 0, y: 2};
    path.1 = {x: 2, y: 2};
    path.2 = {x: 2, y: 8};
    path.3 = {x: 6, y: 8};
    path.4 = {x: 6, y: 2};
    path.5 = {x: 9, y: 2};

}

now.create_creep = function(id, vel, x, y, path, cur_index) {
    create_creep(id, vel, x, y, path, cur_index);
}

var create_creep = function(id,vel,x,y,cur_index) {
    var creep = paper.circle(x, y, tile_size/5);
    creep.attr({'fill': colors()['creep_color']}).glow();
    var api = Object();
    api['id'] = id;
    api['vel'] = vel;
    api['x'] = x;
    api['y'] = y;
    //cur_index is the last location on the path that the creep visited
    api['cur_index'] = cur_index;
    creep.api = api;
    creeps[id] = creep;
}

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
    api['creep_color'] = '#FF6C00';
    api['laser_color'] = '#FF0016';
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

//changes colors along the path
var init_path_graphics = function(){
    var i,j, dir;
    for (i = 0; i < 5; i++){
        var x = path[i]['x'], nx = path[i+1]['x'];
        var y = path[i]['y'], ny = path[i+1]['y'];
        if (x != nx)
        {
            if (nx > x) dir = 1; 
            else dir = -1;
            for(j = x; j <= nx; j += dir)
            {
                map[i][j].td.type = 'path'; 
                map[i][j].td.attr('fill', colors()['path']);
            }
        }else
        {
            if (ny > y) dir = 1; 
            else dir = -1;
            for(j = y; j <= ny; j += dir)
            {
                map[i][j].td.type = 'path'; 
                map[i][j].td.attr('fill', colors()['path']);
            }

        }
    }


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
    now.buildTower(
        this.getAttribute('x'), 
        this.getAttribute('y'),
        this.getAttribute('tower_type')
    );
}

now.client_build_tower = function(success, x, y, type, new_gold) {
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


//update locations of all creeps
//arg: time_step is the delta/change from last update
var update_all_creeps = function() {
    time_step = game_tick_ms; 
    for (var id in creeps) {
        var creep = creeps[id];
    
        if (creep.api.cur_index == creep['api']['path'].length - 1) {
            //we're at the last position, remove the creep
            destroy_creep(id);
        }
        var next = creep['api']['path'][creep.api.cur_index+1];
        
        var x_dir, y_dir;
        var creep_x = creep.api.x;
        var creep_y = creep.api.y;
        var x_diff = Math.abs(next.x - creep_x);
        var y_diff = Math.abs(next.y - creep_y);
        var to_next_loc; //distance to next location

        if (x_diff > y_diff) 
        {
            to_next_loc = x_diff;
            x_dir = next.x - creep_x; y_dir = 0;
        }else
        {
            to_next_loc = y_diff;
            y_dir = next.y - creep_y; x_dir = 0;
        }

        // if reached/past next location
        if(to_next_loc < time_step * creep.vel) 
        {
            creep_x = next.x; creep_y = next.y;
            creep.cur_index = creep.cur_index+1;
        }else // move it closer
        {
            creep_x = creep_x + time_step * creep.api.vel * x_dir;
            creep_y = creep_y + time_step * creep.api.vel * y_dir;
        }
        creep.api['x'] = creep_x;
        creep.api['y'] = creep_y;
        creep.x = creep.api.x * tile_size;
        creep.y = creep.api.y * tile_size;
        //cur_index is the last location on the path that the creep visited
        creep.api['cur_index'] = cur_index; 
    }
}

//used to sync creeps with the information on the server side 
var sync_creeps = function(server_creeps){
    creeps = Object();
    for (var creep in server_creeps) {
        create_creep(creep.id, creep.vel, creep.x, creep.y, creep.path, creep.cur_index);
    }
}

var destroy_creep(id) {
    var creep = creeps[id]; 
    creep.remove();
    delete creep[id];
}

var update_creep_loop = function() {
    var t = setTimeout(update_all_creeps, game_tick_ms);
}

var tower_fire(tower_x, tower_y, creep_id) {
    var creep = creeps[creep_id];
    var laser = draw_laser(tower_x*tile_size, tower_y*tile_size, creep.x, creep.y);
    setTimeout(function(){laser.remove()}, 200);
}

var draw_laser(x, y, cx, cy) {
    var laser = paper.path("M" + x + " " + y + "L" + cx + " " + cy);
    laser.attr({'fill': colors()['laser_color']});
    return laser;
}




