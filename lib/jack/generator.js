(function () {
  var root = (typeof exports !== "undefined" && exports) || this,
      Jack = root.Jack || (root.Jack = {}),
      uses, scope, semi,
      Generators;

  Generators = {

    Block: function (node) {
      scope = Object.create(scope);
      var contents = node.value.map(function (item) {
        var inside;
        semi = true;
        return render(item) + (semi ? ";" : "");
      }).join("\n");
      var vars = Object.keys(scope);
      scope = scope.__proto__;
      if (vars.length > 0) {
        contents = "var " + vars.join(", ") + ";\n" + contents;
      }
      return contents;

    },

    If: function (node) {
      var content = "if (" + render(node.condition) + ") {" +
        block_indent(render(node.yes)) + "}";
      semi = false;
      return content;
    },

    Assign: function (node) {
      if (node.id.name == "ID") {
        if (!scope[node.id.value]) {
          scope[node.id.value] = true;
        }
      }

      return render(node.id) + " = " + render(node.value);
    },

    BOOLEAN: function (node) {
      return node.value ? "true" : "false";
    },

    STRING: function (node) {
      return JSON.stringify(node.value);
    },

    List: function (node) {
      var list = "[" + node.value.map(render).join(", ") + "]";
      if (!node.parent) {
        return list;
      }
      uses["Object.spawn"] = true;
      return "Object.spawn(" + render(node.parent) + ", " + list + ")";
    },

    Object: function (node) {
      var obj = "{" + node.value.map(function (pair) {
        return render(pair[0]) + ": " + render(pair[1]);
      }).join(", ") + "}";
      if (!node.parent) {
        return obj;
      }
      uses["Object.spawn"] = true;
      return "Object.spawn(" + render(node.parent) + ", " + obj + ")";
    },

    Function: function (node) {
      var args = node.value[0],
          payload = node.value[1],
          use_block = true;
      args = args.map(render).join(", ");

      payload = "return " + render(payload) + ";";
      if (use_block) {
        payload = block_indent(payload);
      } else {
        payload = " " + payload + " ";
      }
      return "function (" + args + ") {" + payload + "}";
    },

    INTERPOL: function (node) {
      var raw = false, values;
      values = node.value.map(function (item) {
        if (raw = !raw) {
          return JSON.stringify(item);
        }
        // TODO: Do a Jack compile here.
        return item;
      })
      if (node.type) {
        uses[node.type + ".interpolate"] = true;
        return node.type + ".interpolate(" + values.join(", ") + ")";
      }
      values = values.filter(function (item) {
        return item !== '""';
      });
      if (values.length === 0) {
        return '""';
      }
      if (values.length === 1) {
        return values[0];
      }
      return "(" + values.join(" + ") + ")";
    }

  };

  function block_indent(code) {
    return "\n" + code.split("\n").map(function (line) {
      return "  " + line;
    }).join("\n") + "\n";
  }

  function render(node) {
    if (!node) {
      return "";
    }
    if (Generators[node.name]) {
      return Generators[node.name](node);
    }
    if ((typeof node.name == "string" && node.name.match(/^[A-Z]+$/))) {
      return node.value;
    }
    return JSON.stringify(node);
  }

  Jack.generate = function (tree) {
    var code;
    uses = {};
    scope = {};
    code = render(tree);

    return Object.keys(uses).map(function (name) {
      return "// TODO: Implement " + name + "\n";
    }).join("") + code + "\n";
  };

}());