import { LitElement, html, css } from "lit";
import NLUConfig from "./nlu.md.js";
import ModelOps from "./model-ops.js";

/**
 * @customElement
 *
 */
class ModelTraining extends LitElement {
  static properties = {};
  static styles = css`
    #editor {
      height: 512px;
    }
  `;
  render() {
    return html`
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css"
        />
        <!-- Bootstrap core CSS -->
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
          crossorigin="anonymous"
        />
        <script src="http://cdn.quilljs.com/1.3.6/quill.js"></script>

        <!-- Theme included stylesheets -->
        <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
        <link
          href="//cdn.quilljs.com/1.3.6/quill.bubble.css"
          rel="stylesheet"
        />
      </head>
      <main role="main" class="container" style="margin-top: 76px">
        <div class="jumbotron">
          <h1>NLU Model Training Helper</h1>
          <p class="lead">
            With this tool, you can edit the training data for an NLU model and
            send it to a Rasa NLU server for training.
          </p>
          <form>
            <div class="form-group">
              <label for="formControlTextArea">Model Training Data</label>
              <div id="editor" class=""></div>
            </div>
            <div class="form-group">
              <label for="rasaEndpoint">Rasa NLU Endpoint</label>
              <input
                type="text"
                class="form-control"
                id="rasaEndpoint"
                placeholder=""
                value=""
                required
              />
              <!-- Kubernetes cluster IP of the sbf/rasa-nlu service -->
            </div>
            <div class="form-group">
              <label for="sbfManagerEndpoint">SBF Manager Endpoint</label>
              <input
                type="text"
                class="form-control"
                id="sbfManagerEndpoint"
                placeholder=""
                value=""
                required
              />
            </div>
            <div class="form-row">
              <div class="col">
                <div class="form-group">
                  <label for="dataName">Dataset Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="dataName"
                    placeholder=""
                    value=""
                  />
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label for="loadNameInput">Load Dataset</label>
                  <select
                    id="loadNameInput"
                    class="browser-default custom-select"
                  ></select>
                </div>
              </div>
            </div>
            <div class="d-flex flex-row mb-3 justify-content-between">
              <div>
                <button
                  type="button"
                  class="btn btn-lg btn-info"
                  on-click="storeData"
                >
                  <i class="bi bi-cloud-arrow-up"></i> Store
                </button>
                <button
                  type="button"
                  class="btn btn-lg btn-info"
                  @click="${this.loadData}"
                >
                  <i class="bi bi-cloud-arrow-down"></i> Load
                </button>
                <button
                  type="button"
                  class="btn btn-lg btn-secondary"
                  @click="${this.resetForm}"
                >
                  <i class="bi bi-arrow-clockwise"></i> Reload Example
                </button>
              </div>
              <div>
                <span id="trainingStatus" class="form-text text-muted"></span>
                <button
                  type="button"
                  class="btn btn-lg btn-secondary"
                  @click="${this.retrieveStatus}"
                >
                  <i class="bi bi-cpu"></i> Training Status
                </button>

                <button
                  type="button"
                  class="btn btn-lg btn-primary"
                  @click="${this.submitForm}"
                >
                  <i class="bi bi-upload"></i> Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    `;
  }

  constructor() {
    super();
  }

  firstUpdated() {
    this.rasaEndpoint = this.htmlQuery("#rasaEndpoint");
    this.sbmEndpoint = this.htmlQuery("#sbfManagerEndpoint");
    this.dataName = this.htmlQuery("#dataName");
    this.loadName = this.htmlQuery("#loadNameInput");
    this.curModels = [];
    const _editor = this.shadowRoot.getElementById("editor");
    this.editor = new Quill(_editor, {
      modules: {
        toolbar: [[{ header: [1, 2, false] }], ["bold", "italic", "underline"]],
      },
      formats: ["bold", "color", "font", "italic", "underline"],
      placeholder: "Compose an epic...",
      theme: "snow", // or 'bubble'
    });
    ModelOps.getY(true).then((y) => y.share.training.bindQuill(this.editor));
    ModelOps.getY(true).then((y) => y.share.rasa.bind(this.rasaEndpoint));
    ModelOps.getY(true).then((y) => {
      y.share.sbfManager.bind(this.sbmEndpoint);
      this.updateMenu(this);
      setInterval(this.updateMenu, 10000, this);
    });
    ModelOps.getY(true).then((y) => y.share.dataName.bind(this.dataName));

    ModelOps.getY(true)
      .then((y) => y.share.rasa.toString())
      .then((x) => {
        if (!x) {
          ModelOps.getY(true).then((z) => z.share.rasa.insert(0, "{RASA_NLU}"));
        }
      });
    ModelOps.getY(true)
      .then((y) => y.share.sbfManager.toString())
      .then((x) => {
        if (!x) {
          ModelOps.getY(true).then((z) =>
            z.share.sbfManager.insert(0, "{SBF_MANAGER}")
          );
        }
      });
  }

  htmlQuery(query) {
    return this.shadowRoot.querySelector(query);
  }

  resetForm() {
    if (confirm("Reset textarea to example config?")) {
      this.editor.setText(NLUConfig);
    }
  }

  submitForm() {
    var _this = this;
    $(_this.htmlQuery("#trainingStatus")).text("Starting training...");
    $.ajax({
      type: "POST",
      url: $(_this.htmlQuery("#sbfManagerEndpoint")).val() + "/trainAndLoad/",
      data: JSON.stringify({
        url: $(_this.htmlQuery("#rasaEndpoint")).val(),
        config:
          'language: "de"\npipeline:\n - name: WhitespaceTokenizer\n - name: RegexFeaturizer\n - name: CRFEntityExtractor\n - name: EntitySynonymMapper\n - name: CountVectorsFeaturizer\n - name: DIETClassifier\npolicies:\n - name: MemoizationPolicy\n - name: KerasPolicy\n - name: MappingPolicy\n - name: FormPolicy\n',
        markdownTrainingData: _this.editor.getText(),
      }),
      contentType: "application/json",
      success: function (data, textStatus, jqXHR) {
        $(_this.htmlQuery("#trainingStatus")).text(data);
      },
      error: function (xhr, textStatus, errorThrown) {
        $(_this.htmlQuery("#trainingStatus")).text(
          textStatus + " - " + errorThrown
        );
      },
    });
  }

  retrieveStatus() {
    var _this = this;
    $(_this.htmlQuery("#trainingStatus")).text("Checking status...");
    $.ajax({
      type: "GET",
      url:
        $(_this.htmlQuery("#sbfManagerEndpoint")).val() +
        "/trainAndLoadStatus/",
      contentType: "text/plain",
      success: function (data, textStatus, jqXHR) {
        $(_this.htmlQuery("#trainingStatus")).text(data);
      },
      error: function (xhr, textStatus, errorThrown) {
        $(_this.htmlQuery("#trainingStatus")).text(
          textStatus + " - " + errorThrown
        );
      },
    });
  }

  storeData() {
    var _this = this;
    $(_this.htmlQuery("#trainingStatus")).text("Storing...");
    var name = $(_this.htmlQuery("#dataName")).val();
    var trainingData = _this.editor.getText();

    $.ajax({
      type: "POST",
      url:
        $(_this.htmlQuery("#sbfManagerEndpoint")).val() + "/training/" + name,
      data: trainingData,
      contentType: "text/plain",
      success: function (data, textStatus, jqXHR) {
        $(_this.htmlQuery("#trainingStatus")).text("Data stored.");
        _this.updateMenu(_this);
      },
      error: function (xhr, textStatus, errorThrown) {
        $(_this.htmlQuery("#trainingStatus")).text(
          textStatus + " - " + errorThrown
        );
      },
    });
  }

  loadData() {
    var _this = this;
    $(_this.htmlQuery("#trainingStatus")).text("Loading...");
    var name = $(_this.htmlQuery("#loadNameInput")).val();

    $.ajax({
      type: "GET",
      url:
        $(_this.htmlQuery("#sbfManagerEndpoint")).val() + "/training/" + name,
      contentType: "text/plain",
      success: function (data, textStatus, jqXHR) {
        $(_this.htmlQuery("#trainingStatus")).text("Data loaded.");
        _this.editor.setText(data);
      },
      error: function (xhr, textStatus, errorThrown) {
        $(_this.htmlQuery("#trainingStatus")).text(
          textStatus + " - " + errorThrown
        );
      },
    });
  }

  updateMenu(_this) {
    $.ajax({
      type: "GET",
      url: $(_this.htmlQuery("#sbfManagerEndpoint")).val() + "/training/",
      contentType: "application/json",
      success: function (data, textStatus, jqXHR) {
        $.each(data, function (index, name) {
          if (!_this.curModels.includes(name)) {
            var template = document.createElement("template");
            template.innerHTML = "<option>" + name + "</option>";
            _this.loadName.append(template.content.firstChild);
            _this.curModels.push(name);
          }
        });
      },
    });
  }
}

window.customElements.define("model-training", ModelTraining);
