$.getJSON('/javascripts/crops.json', function(crops) {

function getCropById(id) {
    return _.find(getCrops(), function(crop) {
        return crop.id === id;
    });
}

/**
 * @param CropObject a 突然変異候補
 * @param CropObject b 親
 */
function calculateRatioFor(a, b) {
    // 同種の場合、固定値
    if (a.id === b.id) {
        return 500;
    }

    var value = 0;

    // stat の近さによるボーナス
    var stats = ["che", "foo", "def", "col", "wee"];
    _.each(stats, function(stat) {
        var c = Math.abs(a[stat] - b[stat]);
        switch (c) {
            default: value -= 1;
            case 0: value += 2;
            case 1: value += 1;
            case 2: value += 0;
        }
    });

    // 同一属性のボーナス
    var a_attrs = a.attributes.split(' ');
    var b_attrs = b.attributes.split(' ');
    _.each(a_attrs, function(a_attr) {
        _.each(b_attrs, function(b_attr) {
            if (a_attr.toLowerCase() === b_attr.toLowerCase()) {
                value += 5;
            }
        });
    });

    // Tier ペナルティ
    if (b.tier < a.tier - 1) {
        value -= 2 * (a.tier - b.tier);
    }
    if (b.tier - 3 > a.tier) {
        value -= b.tier - a.tier;
    }

    return Math.max(0, value);
}

function calculateRatiosFor(b) {
    return _.map(getCrops(), function(a) {
        return calculateRatioFor(a, b);
    });
}

/**
 * 全品種の取得
 */
function getCrops() {
    return _.filter(crops, function(crop) {
        if (crop.mod === "ic2") {
            return true;
        } else {
            return $('#' + crop.mod).prop('checked');
        }
    });
}

/**
 * b を親にした時に a に突然変異する確率を計算する
 */
function calculateProbabilityFor(a, b) {
    var ratios = calculateRatiosFor(b);
    var sum = _.reduce(ratios, function(m, n) { return m + n; }, 0);
    return calculateRatioFor(a, b) / sum;
}

/**
 * 各品種が親の場合、a に突然変異するそれぞれの確率を計算する
 */
function calculateProbabilitiesFor(a) {
    return _.map(getCrops(), function(b) {
        return calculateProbabilityFor(a, b);
    });
}


$(function() {

    function refreshTarget() {
        var $target = $('#target');
        $target.empty();
        _.each(getCrops(), function(crop) {
            $target.append($('<option>').attr('value', crop.id).text(crop.name));
        });
    }
    $(':checkbox').click(refreshTarget);
    refreshTarget();

    function refreshResult() {
        var targetId = parseInt($('#target').val(), 10);
        var names = _.map(getCrops(), function(crop) { return crop.name; });
        var props = _.zip(names, calculateProbabilitiesFor(getCropById(targetId)));
        var sortedProps = _.sortBy(props, function(prop) { return -prop[1]; });
        var $tbody = $('#result table tbody');
        $tbody.empty();
        _.each(sortedProps, function(prop) {
            var $tr = $('<tr>');
            $tr.append($('<td>').text(prop[0]));
            $tr.append($('<td>').text(Math.floor(prop[1] * 10000) / 100 + " %"));
            $tbody.append($tr);
        });
    }
    $('#target').change(refreshResult);
    refreshResult();
});

});
