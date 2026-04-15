function payloadLimitHandler(err, req, res, next) {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Payload too large. Reduce image size or resume content.'
    });
  }

  return next(err);
}

module.exports = {
  payloadLimitHandler
};
