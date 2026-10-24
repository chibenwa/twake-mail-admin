import { Fragment } from "react";

/**
 * James names its components in CamelCase, without spaces: offer a line break between the
 * words (EventDeadLetters|HealthCheck, RabbitMQ|DeadLetter...) rather than at an arbitrary letter.
 */
export default function CamelCaseName({ name }: { name: string }) {
  const words = name.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/);
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={index}>
          {index > 0 && <wbr />}
          {word}
        </Fragment>
      ))}
    </>
  );
}
