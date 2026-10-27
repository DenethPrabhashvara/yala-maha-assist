// Turns Postgres errors caused by bad input into 400/409 answers; anything else goes to the error handler
const CLIENT_ERRORS = {
  '23505': [409, 'A row with that value already exists.'],          // unique_violation
  '23503': [409, 'This refers to a row that does not exist, or is still used by other rows.'], // foreign_key_violation
  '23502': [400, 'A required value is missing.'],                    // not_null_violation
  '23514': [400, 'A value is not allowed by a table rule.'],         // check_violation
  '22P02': [400, 'A value has the wrong format.'],                   // invalid_text_representation
  '22003': [400, 'A number is out of range.'],                       // numeric_value_out_of_range
  '22007': [400, 'A date has the wrong format.'],                    // invalid_datetime_format
  '22008': [400, 'A date is out of range.'],                         // datetime_field_overflow
  '22001': [400, 'A text value is too long.'],                       // string_data_right_truncation
  '428C9': [400, 'That column is filled in by the database and cannot be set.'] // generated_always
}

function sendDbError(res, next, error){
  const known = CLIENT_ERRORS[error.code]
  if(!known) return next(error)
  const [status, message] = known
  return res.status(status).json({
    status: 'fail',
    message,
    detail: error.detail || error.message,
    constraint: error.constraint,
    column: error.column
  })
}

module.exports = { sendDbError }
