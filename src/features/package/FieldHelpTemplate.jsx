import { helpId } from "@rjsf/utils";
import Markdown from "marked-react";
import React from "react";
import PropTypes from "prop-types";

export default function FieldHelpTemplate({
  help, idSchema,
}) {
  if (help === "") {
    return null;
  }
  const id = helpId(idSchema);
  return (
    <aside id={id}>
      <Markdown>
        {help}
      </Markdown>
    </aside>
  );
}

FieldHelpTemplate.propTypes = {
  help: PropTypes.string,
  idSchema: PropTypes.shape({ $id: PropTypes.string }).isRequired,
};

FieldHelpTemplate.defaultProps = { help: "" };
